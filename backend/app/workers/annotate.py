"""Burning detection boxes/labels onto a live camera's snapshot image.
(Uploaded videos get no re-rendered copy: the Video Detail page draws the
same boxes live over the original video instead.)
"""
from __future__ import annotations

from pathlib import Path


def draw_detection_box(frame, x1: float, y1: float, x2: float, y2: float, label: str):
    """Draws one detection box with a readable (black-outlined white) label
    directly on `frame`, in place."""
    import cv2

    ix1, iy1, ix2, iy2 = int(x1), int(y1), int(x2), int(y2)
    cv2.rectangle(frame, (ix1, iy1), (ix2, iy2), (255, 255, 255), 2)
    text_y = max(iy1 - 8, 14)
    cv2.putText(frame, label, (ix1 + 1, text_y + 1), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 3, cv2.LINE_AA)
    cv2.putText(frame, label, (ix1, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    return frame


def detection_label(object_class: str, track_id: int, confidence: float, risk: float, color: str = "unknown") -> str:
    prefix = f"{color} " if color and color != "unknown" else ""
    return f"{prefix}{object_class} #{track_id} {confidence * 100:.0f}% risk:{risk:.0f}"


def write_live_snapshot(frame, boxes: list[dict], output_path: Path) -> bool:
    """Overwrites the live-camera snapshot JPEG with the current frame and
    its current detection boxes. This is the "live preview" for a camera:
    not a video stream, but a frequently-refreshed annotated still image
    (see README "Live cameras" for the reasoning)."""
    import cv2

    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        annotated = frame.copy()
        for box in boxes:
            label = detection_label(box["object_class"], box["track_id"], box["confidence"], box["risk"], box.get("color", "unknown"))
            draw_detection_box(annotated, box["x1"], box["y1"], box["x2"], box["y2"], label)
        tmp_path = output_path.with_suffix(".tmp.jpg")
        cv2.imwrite(str(tmp_path), annotated)
        tmp_path.replace(output_path)  # atomic-ish swap so pollers never read a half-written file
        return True
    except Exception:  # noqa: BLE001
        return False
