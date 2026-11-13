from __future__ import annotations

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.base import SessionLocal
from app.models.camera import ProcessingJob
from app.models.incident import Incident
from app.services.job_service import get_events_after, get_job_detection_counts
from app.websocket.manager import manager

router = APIRouter()

POLL_INTERVAL_SECONDS = 1.0
# Job progress is polled faster than incidents: the Video Detail page
# narrates detections in sync with playback, so a 1s lag is visible.
JOB_POLL_INTERVAL_SECONDS = 0.4


@router.websocket("/ws/jobs/{job_id}")
async def ws_job_progress(websocket: WebSocket, job_id: int):
    channel = f"job:{job_id}"
    await manager.connect(channel, websocket)
    last_payload: dict | None = None
    # Cursor over activity_events.id: each tick sends only events newer
    # than the last one this connection has already received, so the
    # client gets every event exactly once, in real time, instead of a
    # fixed newest-15 window that silently drops lines whenever a chunk
    # commit writes more than 15 events at once.
    last_event_id = 0
    try:
        while True:
            db = SessionLocal()
            try:
                job = db.get(ProcessingJob, job_id)
                if job is not None:
                    # Detection counts are included on every tick (not just
                    # on completion) so the client sees what the pipeline is
                    # finding in real time while it's still processing.
                    counts = get_job_detection_counts(db, job_id)
                    new_events = get_events_after(db, job_id, last_event_id)
                    if new_events:
                        last_event_id = new_events[-1]["id"]
                    payload = {
                        "job_id": job.id,
                        "status": job.status.value,
                        "progress_percent": job.progress_percent,
                        "error_message": job.error_message,
                        "total_tracked_objects": counts["total_tracked_objects"],
                        "class_counts": counts["class_counts"],
                        "recent_events": new_events,
                    }
                    if payload != last_payload:
                        await websocket.send_json(payload)
                        last_payload = payload
            finally:
                db.close()
            await asyncio.sleep(JOB_POLL_INTERVAL_SECONDS)
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)


@router.websocket("/ws/incidents")
async def ws_incidents(websocket: WebSocket):
    channel = "incidents"
    await manager.connect(channel, websocket)
    last_seen_id = 0
    try:
        db = SessionLocal()
        try:
            latest = db.query(Incident).order_by(Incident.id.desc()).first()
            if latest:
                last_seen_id = latest.id
        finally:
            db.close()

        while True:
            db = SessionLocal()
            try:
                new_incidents = (
                    db.query(Incident)
                    .filter(Incident.id > last_seen_id)
                    .order_by(Incident.id.asc())
                    .all()
                )
                for incident in new_incidents:
                    await websocket.send_json(
                        {
                            "id": incident.id,
                            "object_class": incident.object_class,
                            "risk_score": incident.risk_score,
                            "priority": incident.priority.value,
                            "status": incident.status.value,
                            "summary": incident.summary,
                            "detected_at": incident.detected_at.isoformat(),
                        }
                    )
                    last_seen_id = incident.id
            finally:
                db.close()
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)
