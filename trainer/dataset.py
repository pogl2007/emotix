"""FER-2013: загрузка датасета в двух форматах — CSV и папки с картинками."""

import os
from typing import Optional, Callable, List, Tuple

import numpy as np
import pandas as pd
import torch
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

from model import EMOTIONS

# Порядок меток в оригинальном FER-2013 CSV
FER_CSV_ORDER = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
# Наш порядок (алфавитный) -> ремап индексов CSV в индексы EMOTIONS
CSV_TO_OURS = {i: EMOTIONS.index(name) for i, name in enumerate(FER_CSV_ORDER)}

MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

DEFAULT_IMG_SIZE = 48


def build_train_transform(img_size: int = DEFAULT_IMG_SIZE):
    """
    Аугментация под FER-2013. RandomResizedCrop даёт сдвиги и масштаб,
    RandomErasing выбивает случайный кусок лица — вместе они и держат
    переобучение, которое на голом flip+rotate начиналось с 13-й эпохи.
    """
    return transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((img_size, img_size)),
        transforms.RandomResizedCrop(img_size, scale=(0.8, 1.0), ratio=(0.9, 1.1)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.25, contrast=0.25),
        transforms.ToTensor(),
        transforms.Normalize(mean=MEAN, std=STD),
        transforms.RandomErasing(p=0.35, scale=(0.02, 0.15), value="random"),
    ])


def build_eval_transform(img_size: int = DEFAULT_IMG_SIZE):
    return transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=MEAN, std=STD),
    ])


train_transform = build_train_transform()
eval_transform = build_eval_transform()


class FER2013CSVDataset(Dataset):
    """
    FER-2013 в формате CSV (fer2013.csv).
    Колонки: emotion (0-6), pixels (строка из 2304 чисел),
    Usage (Training / PublicTest / PrivateTest).
    """

    def __init__(self, csv_path: str, split: str = "Training",
                 transform: Optional[Callable] = None):
        df = pd.read_csv(csv_path)
        self.data = df[df["Usage"] == split].reset_index(drop=True)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.data)

    @property
    def labels(self) -> List[int]:
        return [CSV_TO_OURS[int(e)] for e in self.data["emotion"].tolist()]

    def __getitem__(self, idx: int):
        row = self.data.iloc[idx]
        pixels = np.array(row["pixels"].split(), dtype=np.uint8).reshape(48, 48)
        # grayscale -> RGB, потому что ResNet ждёт 3 канала
        image = np.stack([pixels] * 3, axis=2)

        if self.transform:
            image = self.transform(image)
        else:
            image = torch.from_numpy(image).permute(2, 0, 1).float() / 255.0

        return image, CSV_TO_OURS[int(row["emotion"])]


class FER2013FolderDataset(Dataset):
    """
    FER-2013 в виде папок (kaggle msambare/fer2013):
        root/train/<emotion>/*.jpg
        root/test/<emotion>/*.jpg
    """

    def __init__(self, root: str, split: str = "train",
                 transform: Optional[Callable] = None):
        self.transform = transform
        self.samples: List[Tuple[str, int]] = []
        split_dir = os.path.join(root, split)
        if not os.path.isdir(split_dir):
            raise FileNotFoundError(f"Нет папки {split_dir}")

        for label, emotion in enumerate(EMOTIONS):
            emotion_dir = os.path.join(split_dir, emotion)
            if not os.path.isdir(emotion_dir):
                continue
            for fname in sorted(os.listdir(emotion_dir)):
                if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                    self.samples.append((os.path.join(emotion_dir, fname), label))

        if not self.samples:
            raise RuntimeError(f"В {split_dir} не нашлось изображений")

    def __len__(self) -> int:
        return len(self.samples)

    @property
    def labels(self) -> List[int]:
        return [label for _, label in self.samples]

    def __getitem__(self, idx: int):
        path, label = self.samples[idx]
        image = np.array(Image.open(path).convert("L"), dtype=np.uint8)
        image = np.stack([image] * 3, axis=2)

        if self.transform:
            image = self.transform(image)
        else:
            image = torch.from_numpy(image).permute(2, 0, 1).float() / 255.0

        return image, label


def build_datasets(data_path: str, img_size: int = DEFAULT_IMG_SIZE):
    """
    Возвращает (train_ds, val_ds, test_ds).
    Сам определяет формат: .csv -> CSV-датасет, папка -> folder-датасет.
    """
    train_tf = build_train_transform(img_size)
    eval_tf = build_eval_transform(img_size)

    if data_path.lower().endswith(".csv"):
        train_ds = FER2013CSVDataset(data_path, "Training", train_tf)
        val_ds = FER2013CSVDataset(data_path, "PublicTest", eval_tf)
        test_ds = FER2013CSVDataset(data_path, "PrivateTest", eval_tf)
    else:
        train_ds = FER2013FolderDataset(data_path, "train", train_tf)
        # У folder-версии нет отдельного val — тестовую часть используем и как val.
        val_ds = FER2013FolderDataset(data_path, "test", eval_tf)
        test_ds = val_ds
    return train_ds, val_ds, test_ds


def build_loaders(data_path: str, batch_size: int = 64, num_workers: int = 2,
                  img_size: int = DEFAULT_IMG_SIZE):
    train_ds, val_ds, test_ds = build_datasets(data_path, img_size)
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True,
                              num_workers=num_workers, pin_memory=True,
                              drop_last=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False,
                            num_workers=num_workers, pin_memory=True)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False,
                             num_workers=num_workers, pin_memory=True)
    return (train_loader, val_loader, test_loader), (train_ds, val_ds, test_ds)


def compute_class_weights(dataset) -> torch.Tensor:
    """
    Веса классов для CrossEntropyLoss.
    FER-2013 перекошен: happy ~7200 картинок, disgust ~430.
    Вес = N / (K * count_k) — редкие классы получают больший вес.
    """
    labels = np.array(dataset.labels)
    counts = np.bincount(labels, minlength=len(EMOTIONS)).astype(np.float64)
    counts[counts == 0] = 1.0
    weights = labels.shape[0] / (len(EMOTIONS) * counts)
    return torch.tensor(weights, dtype=torch.float32)


def class_distribution(dataset) -> dict:
    labels = np.array(dataset.labels)
    counts = np.bincount(labels, minlength=len(EMOTIONS))
    return {emotion: int(c) for emotion, c in zip(EMOTIONS, counts)}
