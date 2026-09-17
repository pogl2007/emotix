"""EMOTIX — архитектура модели распознавания эмоций."""

import torch
import torch.nn as nn
from torchvision import models

EMOTIONS = [
    "angry", "disgust", "fear",
    "happy", "neutral", "sad", "surprise",
]

NUM_CLASSES = len(EMOTIONS)


class EmotionNet(nn.Module):
    """
    Fine-tuned ResNet-18 для классификации эмоций.
    Предобученные веса ImageNet -> fine-tune на FER-2013.
    """

    def __init__(self, num_classes: int = NUM_CLASSES, dropout: float = 0.5,
                 pretrained: bool = True, freeze_until: str = "layer2"):
        super().__init__()

        weights = models.ResNet18_Weights.IMAGENET1K_V1 if pretrained else None
        self.backbone = models.resnet18(weights=weights)
        self.freeze_until = freeze_until

        # Ранние слои умеют детектировать базовые фичи (края, градиенты,
        # текстуры), их можно заморозить. Но на FER-2013 лица мелкие и
        # низкоконтрастные — полный fine-tune (freeze_until="none") обычно
        # даёт заметно больше.
        frozen = {"layer1": ["layer1"],
                  "layer2": ["layer1", "layer2"],
                  "none": []}[freeze_until]
        for name, param in self.backbone.named_parameters():
            if any(block in name for block in frozen):
                param.requires_grad = False

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

    def trainable_parameters(self):
        return (p for p in self.parameters() if p.requires_grad)


def build_model(num_classes: int = NUM_CLASSES, dropout: float = 0.5,
                pretrained: bool = True,
                freeze_until: str = "layer2") -> EmotionNet:
    return EmotionNet(num_classes=num_classes, dropout=dropout,
                      pretrained=pretrained, freeze_until=freeze_until)


def load_checkpoint(path: str, device: torch.device) -> EmotionNet:
    """Собирает модель и заливает веса из чекпоинта (без скачивания ImageNet)."""
    checkpoint = torch.load(path, map_location=device, weights_only=False)
    cfg = checkpoint.get("config", {})
    model = EmotionNet(
        num_classes=cfg.get("num_classes", NUM_CLASSES),
        dropout=cfg.get("dropout", 0.5),
        pretrained=False,
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model.to(device)
