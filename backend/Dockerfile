FROM python:3.12-slim

# OpenCV needs these system libs even in headless mode.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Bake the detection weights into the image (YOLO() downloads a bare model
# name into the cwd, i.e. /app/backend). Otherwise every rebuilt container
# re-downloads them on its first job, delaying the first detections.
WORKDIR /app/backend
RUN python -c "from ultralytics import YOLO; YOLO('yolo11m.pt')" && ls -la /app/backend/*.pt
WORKDIR /app

# project.py (the CS50P module) is imported by app/algorithms/risk.py
COPY project.py /app/project.py
COPY backend /app/backend

WORKDIR /app/backend

# celery's own CLI inserts cwd onto sys.path for its "-A app.workers..."
# app discovery, but that trick is celery-specific: a multiprocessing
# "spawn" child process (see app/workers/tasks.py) bootstraps as a plain
# python subprocess with none of that, so it can't `import app` to
# unpickle the submitted function unless the package is actually on
# PYTHONPATH.
ENV PYTHONPATH=/app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
