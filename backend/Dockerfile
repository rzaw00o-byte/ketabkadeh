FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_RETRIES=10

WORKDIR /app

COPY requirements/ requirements/
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements/dev.txt

COPY . .
