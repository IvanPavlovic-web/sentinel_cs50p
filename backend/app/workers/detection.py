"""Object detection applied to a single frame. Shared by both the
file-upload pipeline and the live-camera pipeline, so there is
exactly one detection implementation regardless of where the video comes
from.

There is no synthetic/fallback detector here: if the YOLO model can't be
loaded (missing weights, no internet to download them, a bad
YOLO_MODEL_PATH), the job fails cleanly with that error instead of
inventing detections. A result the pipeline produces is always something
the model actually saw in the footage.
"""
from __future__ import annotations

import queue
import threading
from dataclasses import dataclass

from app.core.config import settings
from app.core.logging import get_logger
from app.workers.visual_attributes import classify_dominant_color

logger = get_logger(__name__)

# COCO class id -> name, for the classes this product cares about.
COCO_RELEVANT_CLASSES = {
    0: "person",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
    # Handheld objects COCO itself can name precisely. Narrating "baseball
    # bat" beats the weapon model's guess, which has read a swung bat as
    # Knife/Rifle/Pistol on the very same frames.
    34: "baseball bat",
    43: "knife",
}
# COCO classes that are potential weapons: detected at a lower confidence
# floor (they're small, thin and often motion-blurred) and used to drop the
# weapon model's duplicate box for the same object.
COCO_DANGEROUS_CLASSES = {"baseball bat", "knife"}


def _box_overlap(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> float:
    """Intersection over the *smaller* box's area: 1.0 when one box sits
    inside the other, which IoU underrates when the two detectors frame the
    same thin object (a bat) with very different box sizes."""
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    smaller = min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1]))
    return (ix * iy) / smaller if smaller > 0 else 0.0


def _same_object(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> bool:
    """Whether two detectors' boxes are the same handheld object. A swung
    bat is thin and diagonal, so the two models' boxes for it can overlap
    only partly: also accept centers closer than half the larger box side."""
    if _box_overlap(a, b) > 0.3:
        return True
    dist = (((a[0] + a[2]) - (b[0] + b[2])) ** 2 + ((a[1] + a[3]) - (b[1] + b[3])) ** 2) ** 0.5 / 2
    side = max(a[2] - a[0], a[3] - a[1], b[2] - b[0], b[3] - b[1])
    return dist < 0.5 * side


@dataclass
class RawDetection:
    frame_number: int
    timestamp: float
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    object_class: str
    dominant_color: str = "unknown"


def load_yolo_model(model_path: str):
    """Loads the YOLO detection model. Raises if it can't be loaded
    (missing YOLO_MODEL_PATH, no internet to download the weights, a bad
    path) -- the caller is expected to let that propagate and fail the job
    with that error, rather than silently detecting nothing or inventing
    something."""
    if not model_path:
        raise RuntimeError("YOLO_MODEL_PATH is not configured")
    from ultralytics import YOLO  # noqa: PLC0415

    return YOLO(model_path)


def load_weapon_model(repo_id: str, filename: str, repo_type: str = "model"):
    """Loads a second, dedicated weapon-detection YOLO model. COCO (what
    YOLO_MODEL_PATH is normally pretrained on) has no gun/knife/rifle
    classes at all, so weapon detection requires a model actually trained
    for it -- this downloads and caches one from the Hugging Face Hub
    (repo_type="model" or "space", since some community weapon-detection
    checkpoints are only published inside a Space's files). Returns None
    (weapon detection simply skipped for this session) on any failure: no
    internet, gated/missing repo, huggingface_hub not installed, etc. This
    one case degrades to "no weapon detections" rather than failing the
    whole job, since the main COCO model is still fully functional and
    produces entirely real results on its own -- unlike the old stub
    detector, skipping here never substitutes fabricated data for real."""
    if not repo_id or not filename:
        return None
    try:
        from huggingface_hub import hf_hub_download  # noqa: PLC0415
        from ultralytics import YOLO  # noqa: PLC0415

        weights_path = hf_hub_download(repo_id=repo_id, filename=filename, repo_type=repo_type)
        return YOLO(weights_path)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Weapon-detection model unavailable (%s); weapon detections disabled for this session.", exc)
        return None


def detect_weapons(weapon_model, frame, frame_number: int, timestamp: float) -> list[RawDetection]:
    """Runs the dedicated weapon-detection model on one frame. The model is
    only reliably trained to spot "something weapon-shaped", not to tell
    a pistol from a rifle from a bat someone's merely holding like one --
    reporting its own fine-grained subtype (gun/knife/rifle/...) asserts a
    certainty the model doesn't actually have and has been wrong in
    practice (a baseball bat read as a pistol). Every hit it raises is
    therefore collapsed to the single canonical WEAPON_MODEL_FALLBACK_CLASS
    ("weapon") -- still a real detection the model actually saw, just not
    a specific type it can't reliably tell apart."""
    try:
        detections: list[RawDetection] = []
        pred = weapon_model(frame, verbose=False, conf=settings.WEAPON_MODEL_CONFIDENCE)[0]
        for box in pred.boxes:
            object_class = settings.WEAPON_MODEL_FALLBACK_CLASS
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
            conf = float(box.conf[0])
            detections.append(
                RawDetection(
                    frame_number=frame_number,
                    timestamp=timestamp,
                    x1=x1, y1=y1, x2=x2, y2=y2,
                    confidence=conf,
                    object_class=object_class,
                    dominant_color=classify_dominant_color(frame, x1, y1, x2, y2, object_class),
                )
            )
        return detections
    except Exception as exc:  # noqa: BLE001 - a failed inference produces no detections, never a fabricated one
        logger.warning("Weapon-detection inference failed for frame %s: %s", frame_number, exc)
        return []


def detect_frame(model, frame, frame_number: int, timestamp: float, weapon_model=None) -> list[RawDetection]:
    """Runs detection on a single already-read frame and returns picklable
    RawDetection rows with dominant color attached. The one call site every
    caller (file chunks, live frames) should use. When `weapon_model` is
    given, its detections (see detect_weapons) are appended, so a frame
    can report e.g. both "person" and "gun". A failed inference on this
    one frame produces no detections for it (logged), not a substitute
    one -- an empty result is still an honest result."""
    detections: list[RawDetection] = []
    try:
        # Inference runs at the lower of the two floors; each class is then
        # held to its own. Without any floor, ultralytics' default 0.25 let
        # through e.g. a 28%-confidence "person" that wasn't there.
        floor = min(settings.DETECTION_CONFIDENCE, settings.DANGEROUS_OBJECT_CONFIDENCE)
        pred = model(frame, verbose=False, conf=floor)[0]
        for box in pred.boxes:
            cls_id = int(box.cls[0])
            if cls_id not in COCO_RELEVANT_CLASSES:
                continue
            object_class = COCO_RELEVANT_CLASSES[cls_id]
            conf = float(box.conf[0])
            min_conf = (
                settings.DANGEROUS_OBJECT_CONFIDENCE
                if object_class in COCO_DANGEROUS_CLASSES
                else settings.DETECTION_CONFIDENCE
            )
            if conf < min_conf:
                continue
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
            detections.append(
                RawDetection(
                    frame_number=frame_number,
                    timestamp=timestamp,
                    x1=x1, y1=y1, x2=x2, y2=y2,
                    confidence=conf,
                    object_class=object_class,
                    dominant_color=classify_dominant_color(frame, x1, y1, x2, y2, object_class),
                )
            )
    except Exception as exc:  # noqa: BLE001 - a failed inference produces no detections, never a fabricated one
        logger.warning("Detection failed for frame %s: %s", frame_number, exc)

    # YOLO's own NMS can return two boxes for one bat (handle vs whole bat
    # overlap too little to be merged), which read as "2 baseball bats".
    # Keep only the most confident box per handheld object.
    kept: list[RawDetection] = []
    for d in sorted(detections, key=lambda d: d.confidence, reverse=True):
        if d.object_class in COCO_DANGEROUS_CLASSES and any(
            k.object_class == d.object_class and _same_object((d.x1, d.y1, d.x2, d.y2), (k.x1, k.y1, k.x2, k.y2))
            for k in kept
        ):
            continue
        kept.append(d)
    detections = kept

    if weapon_model is not None:
        # Drop the weapon model's box when COCO already named that same
        # object (e.g. "baseball bat"): one object, one track, named right.
        named = [(d.x1, d.y1, d.x2, d.y2) for d in detections if d.object_class in COCO_DANGEROUS_CLASSES]
        for w in detect_weapons(weapon_model, frame, frame_number, timestamp):
            if not any(_same_object((w.x1, w.y1, w.x2, w.y2), b) for b in named):
                detections.append(w)

    return detections


# Shared, process-wide models. Measured on the target CPU (6-core i5),
# one process running torch across all cores detects ~3 frames/s with
# yolo11m + the weapon model, while 2-6 worker processes splitting the
# cores managed only 0.5-1.7 frames/s between them (plus 7-37s to spawn and
# load models on every job). So: load each model once per worker, keep it
# in memory across jobs, and run exactly one inference at a time.
_load_lock = threading.Lock()
_inference_lock = threading.Lock()
_model = None
_weapon_model = None
_weapon_loaded = False


def get_models():
    """(main model, weapon model or None), loaded on first use and cached
    for the life of the worker. Raises if the main model can't load."""
    global _model, _weapon_model, _weapon_loaded
    with _load_lock:
        if _model is None:
            _model = load_yolo_model(settings.YOLO_MODEL_PATH)
        if not _weapon_loaded:
            if settings.WEAPON_MODEL_ENABLED:
                _weapon_model = load_weapon_model(
                    settings.WEAPON_MODEL_REPO_ID, settings.WEAPON_MODEL_FILENAME, settings.WEAPON_MODEL_REPO_TYPE
                )
            _weapon_loaded = True
        return _model, _weapon_model


def warm_models() -> None:
    """Loads the models and runs one dummy inference (ultralytics builds its
    predictor lazily on the first call), so the first real job starts
    detecting immediately. Called in the background when the worker boots."""
    import numpy as np

    try:
        model, weapon_model = get_models()
        detect(np.zeros((480, 640, 3), dtype=np.uint8), 0, 0.0)
        logger.info("Detection models warmed up (%s, weapon model %s)", settings.YOLO_MODEL_PATH, "on" if weapon_model else "off")
    except Exception as exc:  # noqa: BLE001 - a job will surface the real error
        logger.warning("Model warm-up failed: %s", exc)


def detect(frame, frame_number: int, timestamp: float) -> list[RawDetection]:
    """detect_frame with the shared models. Serialized: each inference
    already uses every core, so concurrent jobs/cameras interleave frame by
    frame instead of fighting over the CPU."""
    model, weapon_model = get_models()
    with _inference_lock:
        return detect_frame(model, frame, frame_number, timestamp, weapon_model=weapon_model)


def iter_sampled_frames(file_path: str, sample_rate: int, prefetch: int = 8):
    """Yields (frame_number, frame) for every sample_rate-th frame, decoded
    on a background thread so decoding overlaps inference. Skipped frames
    are only grab()bed, never converted to images."""
    import cv2

    sample_rate = max(int(sample_rate), 1)
    q: queue.Queue = queue.Queue(maxsize=prefetch)
    stop = threading.Event()
    end = object()

    def reader() -> None:
        cap = cv2.VideoCapture(file_path)
        try:
            n = 0
            while not stop.is_set():
                if n % sample_rate == 0:
                    ok, frame = cap.read()
                    if not ok:
                        break
                    while not stop.is_set():
                        try:
                            q.put((n, frame), timeout=0.5)
                            break
                        except queue.Full:
                            continue
                elif not cap.grab():
                    break
                n += 1
        finally:
            cap.release()
            # Normal end: block until the consumer takes it. Consumer gone
            # (job failed/stopped): never block on a queue nobody drains.
            while True:
                try:
                    q.put(end, timeout=0.5)
                    break
                except queue.Full:
                    if stop.is_set():
                        break

    thread = threading.Thread(target=reader, daemon=True)
    thread.start()
    try:
        while (item := q.get()) is not end:
            yield item
    finally:
        stop.set()
