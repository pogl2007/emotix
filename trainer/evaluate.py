"""EMOTIX — полная оценка обученной модели: отчёт, confusion matrix, per-class."""

import argparse
import json
import os

import numpy as np
import torch
from sklearn.metrics import classification_report, confusion_matrix

from dataset import build_loaders
from model import EMOTIONS, load_checkpoint


@torch.no_grad()
def collect_predictions(model, loader, device, tta: bool = False):
    """tta=True — усредняем логиты с горизонтально отражённой копией кадра."""
    model.eval()
    all_preds, all_labels = [], []
    for images, labels in loader:
        images = images.to(device)
        outputs = model(images)
        if tta:
            outputs = outputs + model(torch.flip(images, dims=[3]))
        _, preds = torch.max(outputs, 1)
        all_preds.extend(preds.cpu().numpy().tolist())
        all_labels.extend(labels.numpy().tolist())
    return np.array(all_labels), np.array(all_preds)


def save_confusion_matrix(cm, path):
    """Рисует heatmap. Если matplotlib нет — молча пропускает."""
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns
    except ImportError:
        print("matplotlib/seaborn не установлены — картинку пропускаем")
        return

    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Reds",
                xticklabels=EMOTIONS, yticklabels=EMOTIONS)
    plt.xlabel("Предсказано")
    plt.ylabel("Истина")
    plt.title("EMOTIX — confusion matrix (FER-2013)")
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"Confusion matrix: {path}")


def full_evaluation(model, loader, device, results_dir="results", tta=False):
    os.makedirs(results_dir, exist_ok=True)
    labels, preds = collect_predictions(model, loader, device, tta=tta)

    report = classification_report(labels, preds, target_names=EMOTIONS,
                                   digits=4, zero_division=0)
    print(report)

    cm = confusion_matrix(labels, preds, labels=list(range(len(EMOTIONS))))
    save_confusion_matrix(cm, os.path.join(results_dir, "confusion_matrix.png"))

    row_sums = cm.sum(axis=1)
    row_sums[row_sums == 0] = 1
    per_class_acc = {e: float(a) for e, a in
                     zip(EMOTIONS, cm.diagonal() / row_sums)}
    overall = float((labels == preds).mean())

    metrics = {
        "overall_accuracy": overall,
        "per_class_accuracy": per_class_acc,
        "confusion_matrix": cm.tolist(),
        "emotions": EMOTIONS,
        "tta": tta,
    }
    with open(os.path.join(results_dir, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)

    print(f"\nOverall accuracy: {overall:.4f}")
    for emotion, acc in per_class_acc.items():
        print(f"  {emotion:9s} {acc:.4f}")
    return metrics


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="EMOTIX — оценка модели")
    p.add_argument("--data", default="data/fer2013.csv")
    p.add_argument("--checkpoint", default="models/best_emotix.pt")
    p.add_argument("--batch-size", type=int, default=64)
    p.add_argument("--tta", action="store_true",
                   help="усреднять предсказание с отзеркаленным кадром")
    p.add_argument("--num-workers", type=int, default=0)
    args = p.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_checkpoint(args.checkpoint, device)
    # Разрешение берём из чекпоинта — инференс обязан совпадать с обучением
    img_size = torch.load(args.checkpoint, map_location="cpu",
                          weights_only=False).get("config", {}).get("img_size", 48)
    print(f"Вход: {img_size}x{img_size} | TTA: {args.tta}")
    (_, _, test_loader), _ = build_loaders(args.data, args.batch_size,
                                           num_workers=args.num_workers,
                                           img_size=img_size)
    full_evaluation(model, test_loader, device, tta=args.tta)
