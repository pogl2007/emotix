"""Детекция лиц: MTCNN (facenet-pytorch), с фолбэком на Haar cascade из OpenCV."""

from typing import List, Tuple

import cv2
import numpy as np

BBox = Tuple[int, int, int, int]  # x, y, w, h

_MIN_FACE = 24
_PADDING = 0.15  # расширяем bbox — MTCNN режет лоб и подбородок


class FaceDetector:
    def __init__(self, prefer_mtcnn: bool = True, min_confidence: float = 0.90):
        self.min_confidence = min_confidence
        self.backend = "haar"
        self._mtcnn = None
        self._cascade = None

        if prefer_mtcnn:
            try:
                import torch
                from facenet_pytorch import MTCNN

                device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
                self._mtcnn = MTCNN(keep_all=True, device=device,
                                    min_face_size=_MIN_FACE, post_process=False)
                self.backend = "mtcnn"
            except Exception:
                # facenet-pytorch не установлен или не завёлся — работаем на Haar
                self._mtcnn = None

        self._cascade = self._load_cascade()

        if self._mtcnn is None and self._cascade is None:
            self.backend = "none"
            print("[EMOTIX] Нет ни MTCNN, ни Haar cascade. Поставь facenet-pytorch "
                  "или откати opencv-python-headless до 4.x.")

    @staticmethod
    def _load_cascade():
        """
        Haar cascade есть только в OpenCV 4.x — в 5.0 CascadeClassifier убрали
        из python-сборки. Плюс на Windows OpenCV не открывает файлы по пути с
        кириллицей, поэтому если обычная загрузка дала пустой классификатор —
        читаем XML сами и скармливаем его через FileStorage в памяти.
        """
        try:
            path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            if path.isascii():
                cascade = cv2.CascadeClassifier(path)
                if not cascade.empty():
                    return cascade

            with open(path, "r", encoding="utf-8") as f:
                xml = f.read()
            storage = cv2.FileStorage(
                xml, cv2.FILE_STORAGE_READ | cv2.FILE_STORAGE_MEMORY
            )
            cascade = cv2.CascadeClassifier()
            cascade.read(storage.getFirstTopLevelNode())
            return None if cascade.empty() else cascade
        except (AttributeError, OSError, cv2.error):
            return None

    # -- публичный API ----------------------------------------------------

    def detect(self, image: np.ndarray) -> List[Tuple[BBox, np.ndarray, float]]:
        """
        image: BGR-кадр (как отдаёт cv2).
        Возвращает список (bbox, вырезанное лицо BGR, confidence).
        """
        if image is None or image.size == 0:
            return []

        if self._mtcnn is not None:
            boxes = self._detect_mtcnn(image)
        elif self._cascade is not None:
            boxes = self._detect_haar(image)
        else:
            raise RuntimeError(
                "Детектор лиц недоступен: нужен facenet-pytorch (MTCNN) или "
                "opencv-python-headless<5 с Haar cascade."
            )

        results = []
        h, w = image.shape[:2]
        for (x, y, bw, bh), conf in boxes:
            x, y, bw, bh = self._pad(x, y, bw, bh, w, h)
            if bw < _MIN_FACE or bh < _MIN_FACE:
                continue
            crop = image[y:y + bh, x:x + bw]
            if crop.size == 0:
                continue
            results.append(((x, y, bw, bh), crop, conf))

        # Сортируем по площади: самое крупное лицо — первое (оно и доминирующее)
        results.sort(key=lambda r: r[0][2] * r[0][3], reverse=True)
        return results

    def detect_largest(self, image: np.ndarray):
        faces = self.detect(image)
        return faces[0] if faces else None

    # -- бэкенды ----------------------------------------------------------

    def _detect_mtcnn(self, image: np.ndarray):
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        try:
            boxes, probs = self._mtcnn.detect(rgb)
        except Exception:
            return self._detect_haar(image)
        if boxes is None:
            return []

        out = []
        for box, prob in zip(boxes, probs):
            if prob is None or prob < self.min_confidence:
                continue
            x1, y1, x2, y2 = [int(v) for v in box]
            out.append(((x1, y1, x2 - x1, y2 - y1), float(prob)))
        return out

    def _detect_haar(self, image: np.ndarray):
        if self._cascade is None:
            return []
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        faces = self._cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5,
            minSize=(_MIN_FACE, _MIN_FACE),
        )
        # У Haar нет вероятности — отдаём фиксированную
        return [((int(x), int(y), int(w), int(h)), 0.99) for x, y, w, h in faces]

    @staticmethod
    def _pad(x: int, y: int, w: int, h: int, img_w: int, img_h: int) -> BBox:
        dx, dy = int(w * _PADDING), int(h * _PADDING)
        nx = max(0, x - dx)
        ny = max(0, y - dy)
        nw = min(img_w - nx, w + 2 * dx)
        nh = min(img_h - ny, h + 2 * dy)
        return nx, ny, nw, nh


_detector: FaceDetector | None = None


def get_detector() -> FaceDetector:
    global _detector
    if _detector is None:
        _detector = FaceDetector()
    return _detector


def detect_faces(image: np.ndarray):
    return get_detector().detect(image)
