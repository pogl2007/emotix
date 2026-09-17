"""Архитектура модели — копия trainer/model.py, чтобы бэкенд был самодостаточным."""

import torch
import torch.nn as nn
from torchvision import models

EMOTIONS = [
    "angry", "disgust", "fear",
    "happy", "neutral", "sad", "surprise",
]

NUM_CLASSES = len(EMOTIONS)


class EmotionNet(nn.Module):
    """Fine-tuned ResNet-18 для классификации эмоций (7 классов)."""

    def __init__(self, num_classes: int = NUM_CLASSES, dropout: float = 0.5,
                 pretrained: bool = False):
        super().__init__()
        weights = models.ResNet18_Weights.IMAGENET1K_V1 if pretrained else None
        self.backbone = models.resnet18(weights=weights)

        in_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(512, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)
