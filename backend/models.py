"""Pydantic-схемы ответов EMOTIX API."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class BBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class ImageSize(BaseModel):
    width: int
    height: int


class FaceResult(BaseModel):
    face_id: int
    emotion: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    detection_confidence: float
    probabilities: Dict[str, float]
    bbox: BBox


class ImageAnalysis(BaseModel):
    image_size: ImageSize
    faces_detected: int
    results: List[FaceResult]
    dominant_emotion: Optional[str] = None
    detector: str
    processing_ms: int


class TimelinePoint(BaseModel):
    time: float
    frame: int
    emotion: str
    confidence: float
    faces: int
    probabilities: Dict[str, float]
    bbox: BBox


class TopMoment(BaseModel):
    time: float
    timecode: str
    emotion: str
    confidence: float


class DistributionItem(BaseModel):
    emotion: str
    frames: int
    share: float
    mean_probability: float


class VideoAnalysis(BaseModel):
    duration_seconds: float
    fps: float
    frame_step: int
    frames_analyzed: int
    emotion_timeline: List[TimelinePoint]
    dominant_emotions: List[TopMoment]
    emotion_distribution: List[DistributionItem]
    dominant_emotion: Optional[str] = None
    processing_ms: int


class ModelInfo(BaseModel):
    architecture: str
    dataset: str
    classes: int
    emotions: List[str]
    val_accuracy: Optional[float] = None
    device: str
    detector: str
    model_loaded: bool


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
