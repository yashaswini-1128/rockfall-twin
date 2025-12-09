# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
 RUN pip install --no-cache-dir fastapi==0.111.0 uvicorn[standard]==0.30.1 psycopg2-binary==2.9.9 pydantic==2.8.2


COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

