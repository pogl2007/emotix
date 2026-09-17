"""Покадровый разбор видео: каждый N-й кадр -> timeline эмоций."""

import os
import tempfile
from collections import Counter, defaultdict
from typing import Dict, List

import cv2

from face_detector import get_detector
from model_def import EMOTIONS

FRAME_STEP = 10          # анализируем каждый 10-й кадр
MAX_FRAMES = 300         # потолок, чтобы длинное видео не съело сервер


def process_video(video_bytes: bytes, predictor, frame_step: int = FRAME_STEP,
                  max_frames: int = MAX_FRAMES) -> Dict:
    """
    Возвращает словарь с полями duration, frames, dominants, distribution.
    frames — список точек timeline: {time, emotion, confidence, faces, probabilities}
    """
    tmp_path = _write_temp(video_bytes)
    detector = get_detector()

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise ValueError("Не удалось открыть видео")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration = total_frames / fps if fps else 0.0

        # Если видео длинное — увеличиваем шаг, чтобы уложиться в max_frames
        if total_frames and total_frames / frame_step > max_frames:
            frame_step = max(frame_step, total_frames // max_frames)

        timeline: List[Dict] = []
        prob_sums = defaultdict(float)
        frame_idx = 0

        while True:
            ok, frame = cap.read()
            if not ok:
                break

            if frame_idx % frame_step == 0:
                faces = detector.detect(frame)
                if faces:
                    # Ведём timeline по самому крупному лицу в кадре
                    (x, y, w, h), crop, _conf = faces[0]
                    prediction = predictor.predict_face(crop)
                    timeline.append({
                        "time": round(frame_idx / fps, 2),
                        "frame": frame_idx,
                        "emotion": prediction["emotion"],
                        "confidence": prediction["confidence"],
                        "faces": len(faces),
                        "probabilities": prediction["probabilities"],
                        "bbox": {"x": x, "y": y, "width": w, "height": h},
                    })
                    for emotion, p in prediction["probabilities"].items():
                        prob_sums[emotion] += p

            frame_idx += 1

        cap.release()
    finally:
        _cleanup(tmp_path)

    return {
        "duration": round(duration, 2),
        "fps": round(fps, 2),
        "frame_step": frame_step,
        "frames": timeline,
        "dominants": _top_moments(timeline),
        "distribution": _distribution(timeline, prob_sums),
    }


def extract_thumbnail(video_bytes: bytes) -> bytes | None:
    """Первый кадр видео в JPEG — для превью на фронте."""
    tmp_path = _write_temp(video_bytes)
    try:
        cap = cv2.VideoCapture(tmp_path)
        ok, frame = cap.read()
        cap.release()
        if not ok:
            return None
        ok, buf = cv2.imencode(".jpg", frame)
        return buf.tobytes() if ok else None
    finally:
        _cleanup(tmp_path)


def _top_moments(timeline: List[Dict], limit: int = 3) -> List[Dict]:
    """Пиковые моменты: самые уверенные предсказания разных эмоций."""
    best_per_emotion: Dict[str, Dict] = {}
    for point in timeline:
        current = best_per_emotion.get(point["emotion"])
        if current is None or point["confidence"] > current["confidence"]:
            best_per_emotion[point["emotion"]] = point

    moments = sorted(best_per_emotion.values(),
                     key=lambda p: p["confidence"], reverse=True)[:limit]
    return [{
        "time": m["time"],
        "timecode": _timecode(m["time"]),
        "emotion": m["emotion"],
        "confidence": m["confidence"],
    } for m in moments]


def _distribution(timeline: List[Dict], prob_sums) -> List[Dict]:
    """Доля каждой эмоции за всё видео — по количеству кадров-победителей."""
    counts = Counter(p["emotion"] for p in timeline)
    total = sum(counts.values()) or 1
    return [{
        "emotion": emotion,
        "frames": counts.get(emotion, 0),
        "share": counts.get(emotion, 0) / total,
        "mean_probability": (prob_sums.get(emotion, 0.0) / total) if timeline else 0.0,
    } for emotion in EMOTIONS]


def _timecode(seconds: float) -> str:
    total = int(round(seconds))
    return f"{total // 60:02d}:{total % 60:02d}"


def _write_temp(data: bytes) -> str:
    fd, path = tempfile.mkstemp(suffix=".mp4")
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    return path


def _cleanup(path: str):
    try:
        os.remove(path)
    except OSError:
        pass
