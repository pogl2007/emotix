"""EMOTIX — обучение модели на FER-2013.

Примеры:
    python train.py --data data/fer2013.csv --epochs 50
    python train.py --data data/fer2013 --epochs 30 --batch-size 128
"""

import argparse
import json
import os
import time

import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR

from dataset import build_loaders, compute_class_weights, class_distribution
from model import EMOTIONS, NUM_CLASSES, build_model


def get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


@torch.no_grad()
def evaluate(model, loader, criterion, device):
    """Возвращает (accuracy, mean_loss) на переданном лоадере."""
    model.eval()
    correct = 0
    total = 0
    loss_sum = 0.0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss_sum += criterion(outputs, labels).item() * labels.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    return correct / max(total, 1), loss_sum / max(total, 1)


def train(config: dict):
    device = get_device()
    print(f"Устройство: {device}", flush=True)

    (train_loader, val_loader, _), (train_ds, val_ds, _) = build_loaders(
        config["data"], batch_size=config["batch_size"],
        num_workers=config["num_workers"], img_size=config["img_size"],
    )
    print(f"Train: {len(train_ds)} | Val: {len(val_ds)}", flush=True)
    print("Распределение классов:", class_distribution(train_ds))

    model = build_model(NUM_CLASSES, dropout=config["dropout"],
                        freeze_until=config["freeze_until"]).to(device)

    # Дообучение с готового чекпоинта: разрешение и режим заморозки можно
    # менять — ResNet заканчивается adaptive pooling, веса переносятся.
    if config.get("resume"):
        checkpoint = torch.load(config["resume"], map_location=device,
                                weights_only=False)
        model.load_state_dict(checkpoint["model_state_dict"])
        print(f"Стартуем с {config['resume']} "
              f"(val_acc={checkpoint.get('val_acc')})", flush=True)

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"Вход: {config['img_size']}x{config['img_size']} | заморозка: "
          f"{config['freeze_until']} | обучаемых параметров: "
          f"{trainable / 1e6:.1f}M из {total / 1e6:.1f}M", flush=True)

    # Class weights обязательны — датасет сильно несбалансирован
    class_weights = compute_class_weights(train_ds).to(device)
    print("Веса классов:", {e: round(float(w), 3)
                            for e, w in zip(EMOTIONS, class_weights)})
    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=0.05)

    optimizer = optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=config["lr"], weight_decay=0.01,
    )
    scheduler = CosineAnnealingLR(optimizer, T_max=config["epochs"])

    os.makedirs(os.path.dirname(config["out"]) or ".", exist_ok=True)
    os.makedirs("results", exist_ok=True)

    best_val_acc = 0.0
    history = {"train_loss": [], "val_loss": [], "val_acc": [], "lr": []}

    for epoch in range(config["epochs"]):
        started = time.time()
        model.train()
        running_loss = 0.0
        seen = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            running_loss += loss.item() * labels.size(0)
            seen += labels.size(0)

        train_loss = running_loss / max(seen, 1)
        val_acc, val_loss = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        history["lr"].append(optimizer.param_groups[0]["lr"])

        marker = ""
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_acc": val_acc,
                "config": {**config, "num_classes": NUM_CLASSES,
                           "img_size": config["img_size"]},
                "emotions": EMOTIONS,
            }, config["out"])
            marker = "  <- best, сохранено"

        # flush обязателен: при перенаправлении в файл stdout буферизуется
        # блоками, и за многочасовым прогоном иначе не видно прогресса
        print(f"Epoch {epoch + 1}/{config['epochs']} "
              f"| Loss: {train_loss:.4f} "
              f"| Val Loss: {val_loss:.4f} "
              f"| Val Acc: {val_acc:.4f} "
              f"| {time.time() - started:.0f}s{marker}", flush=True)

    history_path = config.get("history", "results/history.json")
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump({"history": history, "best_val_acc": best_val_acc}, f, indent=2)

    print(f"\nЛучшая val accuracy: {best_val_acc:.4f}")
    print(f"Чекпоинт: {config['out']}")
    return model, history


def parse_args():
    p = argparse.ArgumentParser(description="EMOTIX — обучение на FER-2013")
    p.add_argument("--data", default="data/fer2013.csv",
                   help="путь к fer2013.csv или к папке train/test")
    p.add_argument("--out", default="models/best_emotix.pt")
    p.add_argument("--epochs", type=int, default=50)
    p.add_argument("--batch-size", type=int, default=64)
    p.add_argument("--lr", type=float, default=1e-4)
    p.add_argument("--dropout", type=float, default=0.5)
    p.add_argument("--num-workers", type=int, default=2)
    p.add_argument("--img-size", type=int, default=48,
                   help="сторона входного изображения (48 быстро, 96 точнее)")
    p.add_argument("--freeze-until", choices=["none", "layer1", "layer2"],
                   default="layer2", help="какие блоки ResNet заморозить")
    p.add_argument("--resume", default=None,
                   help="дообучить с готового чекпоинта")
    p.add_argument("--history", default="results/history.json")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train({
        "data": args.data,
        "out": args.out,
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "lr": args.lr,
        "dropout": args.dropout,
        "num_workers": args.num_workers,
        "img_size": args.img_size,
        "freeze_until": args.freeze_until,
        "resume": args.resume,
        "history": args.history,
    })
