"""EMOTIX — экспорт чекпоинта: чистый .pt для бэкенда (+ опционально ONNX)."""

import argparse
import os
import shutil

import torch

from model import EMOTIONS, load_checkpoint


def export(checkpoint: str, out: str, onnx: bool = False):
    device = torch.device("cpu")
    model = load_checkpoint(checkpoint, device)

    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    raw = torch.load(checkpoint, map_location=device, weights_only=False)
    torch.save({
        "model_state_dict": model.state_dict(),
        "config": raw.get("config", {}),
        "val_acc": raw.get("val_acc"),
        "emotions": EMOTIONS,
    }, out)
    print(f"Модель сохранена: {out} (val_acc={raw.get('val_acc')})")

    backend_path = os.path.join("..", "backend", "models", "best_emotix.pt")
    if os.path.isdir(os.path.dirname(backend_path)):
        shutil.copyfile(out, backend_path)
        print(f"Скопирована в бэкенд: {backend_path}")

    if onnx:
        dummy = torch.randn(1, 3, 48, 48)
        onnx_path = os.path.splitext(out)[0] + ".onnx"
        torch.onnx.export(model, dummy, onnx_path,
                          input_names=["input"], output_names=["logits"],
                          dynamic_axes={"input": {0: "batch"},
                                        "logits": {0: "batch"}},
                          opset_version=17)
        print(f"ONNX: {onnx_path}")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="EMOTIX — экспорт модели")
    p.add_argument("--checkpoint", default="models/best_emotix.pt")
    p.add_argument("--out", default="models/emotix.pt")
    p.add_argument("--onnx", action="store_true")
    args = p.parse_args()
    export(args.checkpoint, args.out, args.onnx)
