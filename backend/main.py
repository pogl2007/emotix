"""EMOTIX API — FastAPI-сервис распознавания эмоций."""

import os
import time

from fastapi import FastAPI, File, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from models import (HealthResponse, ImageAnalysis, ModelInfo, VideoAnalysis)
from predictor import ModelNotLoaded, get_predictor
from face_detector import get_detector
from video_processor import extract_thumbnail, process_video

VERSION = "1.0.0"
MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB
IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/avi",
               "video/webm"}

MODEL_PATH = os.getenv("EMOTIX_MODEL_PATH", "models/best_emotix.pt")
ALLOWED_ORIGINS = os.getenv(
    "EMOTIX_CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app = FastAPI(
    title="EMOTIX API",
    description="Распознавание эмоций на фото и видео (ResNet-18 / FER-2013)",
    version=VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = get_predictor(MODEL_PATH)


# -- вспомогательное ------------------------------------------------------

async def read_upload(file: UploadFile, allowed_types: set, kind: str) -> bytes:
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(415, f"Неподдерживаемый тип файла для {kind}: "
                                 f"{file.content_type}")
    contents = await file.read()
    if not contents:
        raise HTTPException(400, "Пустой файл")
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Файл больше 50 MB")
    return contents


def guard_model():
    if not predictor.is_ready:
        raise HTTPException(
            503,
            "Модель не загружена. Обучите её: python trainer/train.py, затем "
            "положите best_emotix.pt в backend/models/.",
        )


# -- эндпоинты ------------------------------------------------------------

@app.get("/", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", model_loaded=predictor.is_ready,
                          version=VERSION)


@app.get("/model/info", response_model=ModelInfo)
async def model_info():
    """Информация о модели."""
    return ModelInfo(
        architecture="ResNet-18 (fine-tuned)",
        dataset="FER-2013",
        classes=len(predictor.emotions),
        emotions=predictor.emotions,
        val_accuracy=predictor.val_accuracy,
        device=str(predictor.device),
        detector=get_detector().backend,
        model_loaded=predictor.is_ready,
    )


@app.post("/analyze/image", response_model=ImageAnalysis)
async def analyze_image(file: UploadFile = File(...)):
    """Анализ фото — возвращает эмоции всех найденных лиц."""
    guard_model()
    contents = await read_upload(file, IMAGE_TYPES, "изображения")
    started = time.perf_counter()

    try:
        result = predictor.predict_image(contents)
    except ModelNotLoaded as exc:
        raise HTTPException(503, str(exc))
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    result["processing_ms"] = int((time.perf_counter() - started) * 1000)
    return result


@app.post("/analyze/video", response_model=VideoAnalysis)
async def analyze_video(file: UploadFile = File(...)):
    """
    Анализ видео — обрабатывает каждый 10-й кадр,
    возвращает timeline эмоций, распределение и пиковые моменты.
    """
    guard_model()
    contents = await read_upload(file, VIDEO_TYPES, "видео")
    started = time.perf_counter()

    try:
        timeline = process_video(contents, predictor)
    except ModelNotLoaded as exc:
        raise HTTPException(503, str(exc))
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    dominant = timeline["dominants"][0]["emotion"] if timeline["dominants"] else None
    return VideoAnalysis(
        duration_seconds=timeline["duration"],
        fps=timeline["fps"],
        frame_step=timeline["frame_step"],
        frames_analyzed=len(timeline["frames"]),
        emotion_timeline=timeline["frames"],
        dominant_emotions=timeline["dominants"],
        emotion_distribution=timeline["distribution"],
        dominant_emotion=dominant,
        processing_ms=int((time.perf_counter() - started) * 1000),
    )


@app.post("/video/thumbnail")
async def video_thumbnail(file: UploadFile = File(...)):
    """Первый кадр видео в JPEG — фронт показывает его как превью."""
    contents = await read_upload(file, VIDEO_TYPES, "видео")
    jpeg = extract_thumbnail(contents)
    if jpeg is None:
        raise HTTPException(400, "Не удалось прочитать первый кадр")
    return Response(content=jpeg, media_type="image/jpeg")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0",
                port=int(os.getenv("PORT", "8000")), reload=True)
