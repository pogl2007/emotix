FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# libglib — для opencv, libgomp — для многопоточного torch на CPU
RUN apt-get update \
    && apt-get install -y --no-install-recommends libglib2.0-0 libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# CPU-сборка torch отдельным слоем: без явного индекса pip тянет CUDA на ~2 ГБ,
# а слой кэшируется и не пересобирается при правках кода
RUN pip install torch==2.5.1 torchvision==0.20.1 \
    --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .

# facenet-pytorch жёстко требует torch<2.3 и при обычной установке снёс бы
# CPU-сборку. Ставим его без зависимостей, а нужные ему requests и tqdm — руками
RUN grep -v -e '^torch' -e '^facenet-pytorch' requirements.txt > /tmp/req.txt \
    && pip install -r /tmp/req.txt \
    && pip install requests tqdm \
    && pip install --no-deps facenet-pytorch==2.6.0

COPY . .

# Чекпоинт в образ не кладём — монтируется томом в /app/models.
# Без него сервис поднимется, а /analyze/* ответит 503 с подсказкой
ENV EMOTIX_MODEL_PATH=/app/models/best_emotix.pt \
    PORT=8000

RUN useradd --create-home --uid 1000 emotix && chown -R emotix /app
USER emotix

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/health || exit 1

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
