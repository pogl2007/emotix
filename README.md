# ◈ EMOTIX

Распознавание эмоций на фото и видео. Кастомно обученная CNN (fine-tuned ResNet-18)
на FER-2013, FastAPI-инференс и тёмный интерфейс биометрического сканера на Next.js.

```
emotix/
  trainer/    обучение модели (PyTorch)
  backend/    FastAPI + инференс + детекция лиц
  frontend/   Next.js 14 (app router) + Tailwind + Framer Motion + Recharts
```

7 классов: `angry`, `disgust`, `fear`, `happy`, `neutral`, `sad`, `surprise`.

---

## 1. Модель — `trainer/`

### 1.1 Установка

```bash
cd trainer
python -m venv .venv && . .venv/Scripts/activate   # Windows
# source .venv/bin/activate                        # macOS / Linux
pip install -r requirements.txt
```

### 1.2 Скачать FER-2013 с Kaggle

Нужен аккаунт Kaggle и API-токен: Kaggle → Account → **Create New API Token**,
скачается `kaggle.json`. Положи его сюда:

- Windows: `C:\Users\<ты>\.kaggle\kaggle.json`
- macOS / Linux: `~/.kaggle/kaggle.json` (и `chmod 600 ~/.kaggle/kaggle.json`)

Затем:

```bash
pip install kaggle
mkdir -p data
kaggle datasets download -d msambare/fer2013 -p data
unzip data/fer2013.zip -d data/fer2013
```

Этот датасет распакуется папками:

```
data/fer2013/
  train/angry/*.jpg  train/disgust/  ... train/surprise/
  test/angry/*.jpg   ...
```

Альтернатива — классический CSV (`fer2013.csv` с колонками `emotion`, `pixels`,
`Usage`), например датасет `deadskull7/fer2013`. Оба формата поддерживаются:
`dataset.py` сам определяет, что ему подсунули — путь к `.csv` или к папке.

### 1.3 Обучение

```bash
# папочный вариант
python train.py --data data/fer2013 --epochs 40 --batch-size 64

# CSV-вариант
python train.py --data data/fer2013.csv --epochs 50
```

Что происходит:

- ResNet-18 с весами ImageNet, `layer1`/`layer2` заморожены, обучаются
  `layer3`, `layer4` и новая голова (Dropout → 512 → ReLU → Dropout → 7);
- **class weights** в `CrossEntropyLoss` — FER-2013 сильно несбалансирован
  (`happy` ≈ 7 200 картинок, `disgust` ≈ 430), без весов модель схлопывается
  в предсказание `happy`;
- аугментация: horizontal flip, поворот ±15°, brightness/contrast jitter;
- AdamW (`lr=1e-4`, `weight_decay=0.01`), CosineAnnealingLR, clip_grad_norm 1.0;
- лучший по val accuracy чекпоинт пишется в `models/best_emotix.pt`,
  история обучения — в `results/history.json`.

**Ожидаемые метрики.** FER-2013 — сложный датасет: человек на нём даёт ~65%,
SOTA ≈ 73%. Нормальный результат этой конфигурации — **val accuracy 60–70%**,
70%+ — отлично. По классам разброс большой: `happy` и `surprise` обычно
0.75–0.85, `fear` и `disgust` — 0.35–0.55.

Время: ~4–8 минут на эпоху на CPU, ~20–40 секунд на эпоху на GPU уровня
RTX 3060. Без GPU имеет смысл взять `--epochs 15`, точность просядет на 2–4 пункта.

### 1.4 Оценка

```bash
python evaluate.py --data data/fer2013 --checkpoint models/best_emotix.pt
```

Печатает `classification_report`, сохраняет `results/confusion_matrix.png`
и `results/metrics.json` с per-class accuracy.

### 1.5 Экспорт в бэкенд

```bash
python export.py --checkpoint models/best_emotix.pt --out models/emotix.pt
```

Скрипт сам копирует файл в `backend/models/best_emotix.pt`.
Флаг `--onnx` дополнительно кладёт рядом ONNX-версию.

---

## 2. Бэкенд — `backend/`

```bash
cd backend
python -m venv .venv && . .venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Документация Swagger: http://localhost:8000/docs

| Метод | Путь               | Что делает                                              |
|-------|--------------------|---------------------------------------------------------|
| GET   | `/health`          | статус сервиса и загружена ли модель                    |
| GET   | `/model/info`      | архитектура, датасет, val accuracy, устройство, детектор |
| POST  | `/analyze/image`   | эмоции всех лиц на фото + bbox                          |
| POST  | `/analyze/video`   | timeline эмоций, распределение, пиковые моменты         |
| POST  | `/video/thumbnail` | первый кадр видео в JPEG                                |

Лимит загрузки — 50 MB. Видео разбирается по каждому 10-му кадру; для длинных
роликов шаг увеличивается автоматически, чтобы не превысить 300 разобранных кадров.

**Детекция лиц.** По умолчанию MTCNN из `facenet-pytorch`. Если пакет не встал
(он тянет отдельные веса), детектор молча падает на Haar cascade из OpenCV —
API продолжает работать, какой бэкенд активен видно в `/model/info`.
Поэтому OpenCV пришлось прижать к `<5.0.0`: в пятой версии `CascadeClassifier`
из python-сборки убрали, и фолбэка не остаётся. На Windows каскад дополнительно
грузится через `FileStorage` в памяти — OpenCV не открывает файлы по пути
с кириллицей.

Переменные окружения:

```
EMOTIX_MODEL_PATH=models/best_emotix.pt
EMOTIX_CORS_ORIGINS=http://localhost:3000,https://emotix.vercel.app
PORT=8000
```

Без чекпоинта сервис поднимется, но `/analyze/*` вернёт `503` с подсказкой —
это специально, чтобы фронт показывал внятную ошибку вместо падения.

---

## 3. Фронтенд — `frontend/`

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Открыть http://localhost:3000

Страницы:

- `/` — лендинг: hero со сканирующей линией и corner brackets, статистика,
  сетка семи эмоций, три шага работы;
- `/analyze` — две зоны: слева drag & drop и превью, справа результаты.
  Для фото — bbox поверх изображения через Canvas API (цвет рамки = цвет
  эмоции, бейдж `[EMOTION 94%]`) и карточка на каждое лицо с барами по семи
  классам. Для видео — Recharts AreaChart с timeline, PieChart распределения
  и три пиковых момента;
- `/history` — прошлые анализы. Аккаунт (email + пароль) локальный:
  и учётка, и история лежат в `localStorage` этого браузера, пароль никуда
  не отправляется. Это разделение историй, а не настоящая авторизация;
  для продакшена сюда нужен нормальный бэкенд с сессиями.

Дизайн-система — в `tailwind.config.ts` (цвета фона/поверхностей, красный
акцент `#dc2626`, цвета семи эмоций) и `app/globals.css` (сетка на фоне,
скроллбар, кнопки). Шрифты — Space Grotesk для UI и JetBrains Mono для чисел.

---

## 4. Деплой

**Backend → Railway.** Подключить репозиторий, root directory `backend`.
`railway.json` и `Procfile` уже настроены (`uvicorn main:app --host 0.0.0.0
--port $PORT`, healthcheck `/health`). Переменные: `EMOTIX_CORS_ORIGINS` с
адресом фронта. Файл `best_emotix.pt` (~45 MB) надо доставить в образ:
либо закоммитить через Git LFS, либо скачивать при старте из S3/Hugging Face —
`.gitignore` по умолчанию его не пускает в репозиторий.

**Frontend → Vercel.** Root directory `frontend`, переменная окружения
`NEXT_PUBLIC_API_URL` = адрес Railway-сервиса. CORS на бэкенде уже разрешает
любой `*.vercel.app`.

---

## 5. Полный прогон с нуля

```bash
# 1. модель
cd trainer && pip install -r requirements.txt
kaggle datasets download -d msambare/fer2013 -p data && unzip data/fer2013.zip -d data/fer2013
python train.py --data data/fer2013 --epochs 40
python evaluate.py --data data/fer2013
python export.py

# 2. бэкенд
cd ../backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. фронтенд (в другом терминале)
cd ../frontend && npm install && npm run dev
```
