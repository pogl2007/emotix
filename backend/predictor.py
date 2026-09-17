"""Загрузка модели EMOTIX и инференс по лицам."""

import os
from typing import Dict, List, Optional

import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from face_detector import get_detector
from model_def import EMOTIONS, NUM_CLASSES, EmotionNet


class ModelNotLoaded(RuntimeError):
    pass


class EmotionPredictor:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.emotions = EMOTIONS
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.val_accuracy: Optional[float] = None
        self.model: Optional[EmotionNet] = None
        # Реальное значение приедет из чекпоинта — модель, обученную на 96x96,
        # нельзя кормить 48x48, предсказания разъедутся.
        self.img_size = 48
        self.tta = os.getenv("EMOTIX_TTA", "1") not in ("0", "false", "False")
        self.transform = self._build_transform(self.img_size)

        self._load()

    @staticmethod
    def _build_transform(img_size: int):
        return transforms.Compose([
            transforms.Resize((img_size, img_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225]),
        ])

    # -- загрузка ---------------------------------------------------------

    def _load(self):
        if not os.path.exists(self.model_path):
            print(f"[EMOTIX] Чекпоинт не найден: {self.model_path}. "
                  f"Сначала обучите модель (см. trainer/README).")
            return

        checkpoint = torch.load(self.model_path, map_location=self.device,
                                weights_only=False)
        cfg = checkpoint.get("config", {})
        model = EmotionNet(num_classes=cfg.get("num_classes", NUM_CLASSES),
                           dropout=cfg.get("dropout", 0.5), pretrained=False)
        model.load_state_dict(checkpoint["model_state_dict"])
        model.eval()
        self.model = model.to(self.device)
        self.val_accuracy = checkpoint.get("val_acc")
        self.emotions = checkpoint.get("emotions", EMOTIONS)
        self.img_size = int(cfg.get("img_size", 48))
        self.transform = self._build_transform(self.img_size)
        print(f"[EMOTIX] Модель загружена ({self.device}), "
              f"вход {self.img_size}x{self.img_size}, TTA={self.tta}, "
              f"val_acc={self.val_accuracy}")

    @property
    def is_ready(self) -> bool:
        return self.model is not None

    def _require_model(self):
        if self.model is None:
            raise ModelNotLoaded(
                "Модель не загружена. Обучите её (trainer/train.py) и положите "
                f"чекпоинт в {self.model_path}."
            )

    # -- инференс ---------------------------------------------------------

    def predict_face(self, face_image: np.ndarray) -> Dict:
        """Предсказание для одного вырезанного лица (BGR)."""
        self._require_model()

        pil_image = Image.fromarray(cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB))
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")

        tensor = self.transform(pil_image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(tensor)
            if self.tta:
                # Отражённая копия кадра: лицо симметрично, усреднение логитов
                # стабильно добавляет доли процента точности
                outputs = outputs + self.model(torch.flip(tensor, dims=[3]))
            probabilities = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)

        probs = probabilities[0].cpu().numpy()
        return {
            "emotion": self.emotions[int(predicted.item())],
            "confidence": float(confidence.item()),
            "probabilities": {e: float(p) for e, p in zip(self.emotions, probs)},
        }

    def predict_faces_batch(self, face_images: List[np.ndarray]) -> List[Dict]:
        """Батчевый инференс — заметно быстрее при разборе видео."""
        self._require_model()
        if not face_images:
            return []

        tensors = []
        for face in face_images:
            pil = Image.fromarray(cv2.cvtColor(face, cv2.COLOR_BGR2RGB))
            tensors.append(self.transform(pil))
        batch = torch.stack(tensors).to(self.device)

        with torch.no_grad():
            logits = self.model(batch)
            if self.tta:
                logits = logits + self.model(torch.flip(batch, dims=[3]))
            probabilities = torch.softmax(logits, dim=1).cpu().numpy()

        results = []
        for probs in probabilities:
            idx = int(np.argmax(probs))
            results.append({
                "emotion": self.emotions[idx],
                "confidence": float(probs[idx]),
                "probabilities": {e: float(p) for e, p in zip(self.emotions, probs)},
            })
        return results

    def predict_image(self, image_bytes: bytes) -> Dict:
        """Анализ целого изображения: детекция лиц + эмоция для каждого."""
        self._require_model()

        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Не удалось декодировать изображение")

        height, width = image.shape[:2]
        faces = get_detector().detect(image)

        results = []
        crops = [crop for _, crop, _ in faces]
        predictions = self.predict_faces_batch(crops)

        for i, (((x, y, w, h), _crop, det_conf), prediction) in enumerate(
                zip(faces, predictions)):
            prediction["face_id"] = i + 1
            prediction["detection_confidence"] = det_conf
            prediction["bbox"] = {"x": x, "y": y, "width": w, "height": h}
            results.append(prediction)

        return {
            "image_size": {"width": width, "height": height},
            "faces_detected": len(results),
            "results": results,
            "dominant_emotion": results[0]["emotion"] if results else None,
            "detector": get_detector().backend,
        }


_predictor: Optional[EmotionPredictor] = None


def get_predictor(model_path: str = None) -> EmotionPredictor:
    global _predictor
    if _predictor is None:
        path = model_path or os.getenv("EMOTIX_MODEL_PATH",
                                       "models/best_emotix.pt")
        _predictor = EmotionPredictor(path)
    return _predictor
