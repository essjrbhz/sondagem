FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "find /app -name '*.pyc' -delete && find /app -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null; alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]
