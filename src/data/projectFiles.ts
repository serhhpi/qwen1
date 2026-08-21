export type FileLang = "python" | "yaml" | "bash" | "html" | "text";

export interface ProjectFile {
  path: string;
  lang: FileLang;
  note: string;
  content: string;
}

/* ============================================================
   Полный исходный код Python-проекта «Qwen Excel Bridge».
   Строки хранятся в String.raw, чтобы обратные слэши
   (regex, экранирование) дошли до экрана без изменений.
   ============================================================ */

const MAIN_PY = String.raw`"""Qwen Excel Bridge — веб-сервис на FastAPI.

Принимает .xlsx/.xls от пользователя, прогоняет таблицу через Qwen
по предустановленному промту из prompt.yaml и отдаёт обработанный
.xlsx обратно.

Запуск:      uvicorn main:app --reload
Интерфейс:   http://127.0.0.1:8000
"""

from __future__ import annotations

import uuid
from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import HTMLResponse, Response

from excel_handler import build_excel, read_excel_to_text
from qwen_client import QwenClient

ALLOWED_EXT = {".xlsx", ".xls"}
UPLOAD_LIMIT = 10 * 1024 * 1024  # 10 МБ

app = FastAPI(title="Qwen Excel Bridge")

_qwen: QwenClient | None = None
_results: dict[str, dict] = {}  # токен -> {"bytes": ..., "name": ...}


def get_qwen() -> QwenClient:
    """Ленивая инициализация клиента (ключ проверяется при первом запросе)."""
    global _qwen
    if _qwen is None:
        _qwen = QwenClient()
    return _qwen


@app.get("/", response_class=HTMLResponse)
def index() -> HTMLResponse:
    """Простой веб-интерфейс: загрузка файла -> обработка -> скачивание."""
    html = (Path(__file__).parent / "templates" / "index.html").read_text("utf-8")
    return HTMLResponse(html)


@app.post("/api/process")
async def process(file: UploadFile = File(...)) -> dict:
    """Принимает Excel, отправляет таблицу в Qwen, отдаёт JSON-превью и токен."""
    ext = Path(file.filename or "upload.xlsx").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, "Поддерживаются только файлы .xlsx и .xls")

    data = await file.read()
    if not data:
        raise HTTPException(400, "Файл пустой")
    if len(data) > UPLOAD_LIMIT:
        raise HTTPException(413, "Файл больше 10 МБ — сократите таблицу")

    try:
        sheet = read_excel_to_text(data)
        result = get_qwen().process_table(
            sheet["text"], file.filename or "upload.xlsx", sheet["sheet_name"]
        )
    except RuntimeError as exc:  # нет ключа или prompt.yaml
        raise HTTPException(500, str(exc)) from exc
    except ValueError as exc:  # битый файл или не-JSON ответ модели
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:  # сеть, лимиты API, таймаут
        raise HTTPException(502, f"Запрос к Qwen не удался: {exc}") from exc

    out_name = Path(file.filename or "upload.xlsx").stem + "_processed.xlsx"
    token = uuid.uuid4().hex
    _results[token] = {"bytes": build_excel(result), "name": out_name}

    return {
        "token": token,
        "file_name": out_name,
        "sheet": sheet["sheet_name"],
        "rows_in": sheet["row_count"],
        "columns": result.get("columns", []),
        "rows": result.get("rows", [])[:50],  # превью для веб-интерфейса
        "summary": result.get("summary", ""),
    }


@app.get("/api/download/{token}")
def download(token: str) -> Response:
    """Отдаёт собранный .xlsx по одноразовому токену."""
    item = _results.pop(token, None)
    if item is None:
        raise HTTPException(404, "Файл не найден — обработайте таблицу ещё раз")
    return Response(
        content=item["bytes"],
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename*=UTF-8''" + quote(item["name"])
        },
    )
`;

const QWEN_CLIENT_PY = String.raw`"""Клиент Qwen: читает промт из prompt.yaml и отправляет таблицу модели.

Используется OpenAI-совместимый режим DashScope, поэтому достаточно
пакета openai — отдельный SDK DashScope не нужен.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

import yaml
from openai import OpenAI

PROMPT_FILE = Path(__file__).parent / "prompt.yaml"
DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

# Тройной обратный апостроф (ограждение кода в markdown) — собираем
# через код символа, чтобы шаблон оставался читаемым.
_FENCE = "\x60" * 3


def load_prompt(path: Path = PROMPT_FILE) -> dict[str, Any]:
    """Загружает промт и параметры генерации из YAML-файла."""
    if not path.exists():
        raise FileNotFoundError(
            f"Файл {path.name} не найден рядом с main.py — создайте его по шаблону."
        )
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    for key in ("system", "user"):
        if not str(cfg.get(key, "")).strip():
            raise ValueError(f"В prompt.yaml нет обязательной секции '{key}'.")
    return cfg


class QwenClient:
    """Обёртка над Qwen: промт берётся из prompt.yaml, ключ — из окружения."""

    def __init__(self, prompt_path: Path = PROMPT_FILE) -> None:
        self.cfg = load_prompt(prompt_path)
        api_key = os.getenv("DASHSCOPE_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError(
                "Переменная окружения DASHSCOPE_API_KEY не задана. "
                "Скопируйте .env.example в .env и впишите ключ "
                "(https://dashscope.console.aliyun.com)."
            )
        self._client = OpenAI(
            api_key=api_key,
            base_url=str(self.cfg.get("base_url", DEFAULT_BASE_URL)),
        )

    def process_table(
        self, table_data: str, file_name: str, sheet_name: str
    ) -> dict[str, Any]:
        """Отправляет таблицу в Qwen и возвращает разобранный JSON-ответ."""
        user_prompt = str(self.cfg["user"]).format(
            table_data=table_data,
            file_name=file_name,
            sheet_name=sheet_name,
        )
        params: dict[str, Any] = {
            "model": self.cfg.get("model", "qwen-plus"),
            "messages": [
                {"role": "system", "content": str(self.cfg["system"])},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": float(self.cfg.get("temperature", 0.2)),
            "max_tokens": int(self.cfg.get("max_tokens", 8192)),
        }
        if self.cfg.get("json_mode", True):
            params["response_format"] = {"type": "json_object"}

        resp = self._client.chat.completions.create(**params)
        raw = resp.choices[0].message.content or ""
        return extract_json(raw)


def extract_json(raw: str) -> dict[str, Any]:
    """Достаёт JSON из ответа, даже если модель обернула его в markdown-ограждение."""
    fenced = re.search(
        re.escape(_FENCE) + r"(?:json)?\s*([\s\S]*?)" + re.escape(_FENCE), raw
    )
    text = fenced.group(1) if fenced else raw
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise ValueError("Не удалось разобрать JSON в ответе модели.") from None
`;

const EXCEL_HANDLER_PY = String.raw`"""Работа с Excel: чтение листа в текст для модели и сборка .xlsx из JSON."""

from __future__ import annotations

import io
from typing import Any

import pandas as pd

MAX_ROWS = 300  # сколько строк отправляем модели (защита от лимита токенов)
MAX_TEXT = 120_000  # символов: дальше модель упрётся в контекст


def read_excel_to_text(data: bytes) -> dict[str, Any]:
    """Читает первый непустой лист и превращает его в CSV-текст."""
    try:
        sheets: dict[str, pd.DataFrame] = pd.read_excel(
            io.BytesIO(data), sheet_name=None
        )
    except Exception as exc:  # битый файл, пароль, не-Excel
        raise ValueError(f"Не удалось прочитать файл как Excel: {exc}") from exc

    for name, df in sheets.items():
        if not df.empty:
            break
    else:
        raise ValueError("В файле нет ни одного заполненного листа.")

    total = len(df)
    df = df.head(MAX_ROWS).fillna("")
    text = df.to_csv(index=False)
    if len(text) > MAX_TEXT:
        raise ValueError("Лист слишком большой: оставьте до ~300 строк.")

    return {
        "sheet_name": name,
        "columns": [str(c) for c in df.columns],
        "row_count": min(total, MAX_ROWS),
        "truncated": total > MAX_ROWS,
        "text": text,
    }


def build_excel(result: dict[str, Any]) -> bytes:
    """Собирает .xlsx из JSON-ответа модели: лист «Результат» + лист «Отчёт»."""
    columns = result.get("columns") or []
    rows = result.get("rows") or []
    summary = str(result.get("summary", ""))

    df = pd.DataFrame(rows, columns=columns or None)

    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Результат", index=False)
        if summary:
            pd.DataFrame({"Отчёт": [summary]}).to_excel(
                writer, sheet_name="Отчёт", index=False
            )
    return buf.getvalue()
`;

const PROMPT_YAML = String.raw`# ============================================================
#  prompt.yaml — предустановленный промт и параметры генерации.
#  Правьте этот файл, чтобы менять поведение программы,
#  не трогая Python-код.
# ============================================================

# Модель Qwen (через OpenAI-совместимый режим DashScope)
model: "qwen-plus"            # qwen-turbo | qwen-plus | qwen-max | qwen-long

# Для аккаунта Aliyun (Китай) замените на:
#   https://dashscope.aliyuncs.com/compatible-mode/v1
base_url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

temperature: 0.2              # меньше — строже и стабильнее
max_tokens: 8192
json_mode: true               # требовать от модели JSON-объект

system: |
  Ты — внимательный аналитик данных. Ты обрабатываешь табличные
  данные строго по заданному алгоритму, без выдумок и пропусков.
  Отвечаешь только валидным JSON — без пояснений и без
  markdown-ограждений.

user: |
  ## Задача
  Обработай данные из Excel-файла «{file_name}» (лист «{sheet_name}»)
  по алгоритму ниже.

  ## Алгоритм
  1. Проверь каждую строку: пропущенные значения в числовых колонках
     замени на 0.
  2. Добавь колонку «Категория»: классифицируй товар в одну из
     категорий — электроника, одежда, продукты, прочее.
  3. Добавь колонку «Сумма» = «Количество» * «Цена»
     (с точностью до 2 знаков).
  4. Отсортируй строки по убыванию колонки «Сумма».
  5. Сохрани все исходные колонки и все строки без изменений.

  ## Формат ответа
  Только JSON вида:
  {
    "columns": ["Товар", "Количество", "Цена", "Категория", "Сумма"],
    "rows": [["Ноутбук", 3, 54990, "электроника", 164970.00], ...],
    "summary": "краткое описание выполненных преобразований"
  }

  ## Данные (CSV-представление листа):
  {table_data}
`;

const INDEX_HTML = String.raw`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Qwen Excel Bridge</title>
  <style>
    :root {
      --bg:#0b1726; --panel:#0e1d30; --line:#1d3450;
      --ink:#e9f1fa; --mut:#93a9c2; --amber:#ffb454;
      --teal:#45d6c0; --red:#ff6b6b;
    }
    * { box-sizing: border-box; }
    body { margin:0; font-family:"Segoe UI",system-ui,sans-serif;
           background:var(--bg); color:var(--ink); }
    .wrap { max-width:960px; margin:0 auto; padding:48px 20px; }
    h1 { font-size:26px; margin:0 0 4px; }
    .sub { color:var(--mut); margin:0 0 32px; }
    .drop { border:2px dashed var(--line); border-radius:12px;
            padding:44px 20px; text-align:center; cursor:pointer;
            transition:.2s; background:var(--panel); }
    .drop:hover, .drop.drag { border-color:var(--amber); background:#122338; }
    .drop b { color:var(--amber); }
    .btn { display:inline-block; margin-top:24px; padding:12px 26px; border:0;
           border-radius:10px; background:var(--amber); color:#221302;
           font-weight:700; font-size:15px; cursor:pointer; }
    .btn:disabled { opacity:.45; cursor:wait; }
    .btn.ghost { background:transparent; color:var(--teal);
                 border:1px solid var(--teal); margin-left:10px;
                 text-decoration:none; }
    .status { margin-top:18px; color:var(--mut); min-height:22px; }
    .err { color:var(--red); }
    .ok { color:var(--teal); }
    table { border-collapse:collapse; width:100%; margin-top:26px; font-size:14px; }
    th, td { border:1px solid var(--line); padding:8px 10px; text-align:left; }
    th { background:var(--panel); color:var(--amber); }
    tr:nth-child(even) td { background:rgba(255,255,255,.02); }
    .card { margin-top:34px; background:var(--panel); border:1px solid var(--line);
            border-radius:14px; padding:22px; }
    .badge { display:inline-block; padding:2px 10px; border-radius:999px;
             font-size:12px; border:1px solid var(--line); color:var(--mut);
             margin-right:8px; }
    .hidden { display:none; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Qwen Excel Bridge</h1>
    <p class="sub">Загрузите .xlsx — модель Qwen обработает таблицу
       по промту из prompt.yaml и вернёт готовый файл.</p>

    <div class="drop" id="drop">
      Перетащите файл сюда или <b>выберите на диске</b>
      <div class="status" id="fileLine"></div>
      <input type="file" id="file" accept=".xlsx,.xls" hidden />
    </div>

    <button class="btn" id="run" disabled>Обработать через Qwen</button>
    <p class="status" id="status"></p>

    <div class="card hidden" id="result">
      <span class="badge" id="metaSheet"></span>
      <span class="badge" id="metaRows"></span>
      <p class="ok" id="summary"></p>
      <div style="overflow-x:auto"><table id="preview"></table></div>
      <a class="btn ghost" id="dl" href="#">Скачать .xlsx</a>
    </div>
  </div>

<script>
  var drop = document.getElementById('drop');
  var input = document.getElementById('file');
  var run = document.getElementById('run');
  var status = document.getElementById('status');
  var fileLine = document.getElementById('fileLine');
  var chosen = null;

  drop.addEventListener('click', function () { input.click(); });
  drop.addEventListener('dragover', function (e) {
    e.preventDefault(); drop.classList.add('drag');
  });
  drop.addEventListener('dragleave', function () { drop.classList.remove('drag'); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault(); drop.classList.remove('drag');
    if (e.dataTransfer.files.length) pick(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', function () {
    if (input.files.length) pick(input.files[0]);
  });

  function pick(f) {
    chosen = f;
    fileLine.textContent = 'Файл: ' + f.name + ' (' + (f.size / 1024).toFixed(1) + ' КБ)';
    run.disabled = false;
    status.textContent = '';
  }

  run.addEventListener('click', function () {
    if (!chosen) return;
    var form = new FormData();
    form.append('file', chosen);
    run.disabled = true;
    status.className = 'status';
    status.textContent = 'Отправляем таблицу в Qwen… это может занять до минуты.';

    fetch('/api/process', { method: 'POST', body: form })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, d: d }; });
      })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d.detail || 'Ошибка обработки');
        show(res.d);
      })
      .catch(function (e) {
        status.className = 'status err';
        status.textContent = 'Ошибка: ' + e.message;
      })
      .finally(function () { run.disabled = false; });
  });

  function show(d) {
    status.className = 'status ok';
    status.textContent = 'Готово! Результат можно скачать ниже.';
    document.getElementById('metaSheet').textContent = 'лист: ' + d.sheet;
    document.getElementById('metaRows').textContent = 'строк: ' + d.rows_in;
    document.getElementById('summary').textContent = d.summary || '';
    document.getElementById('dl').href = '/api/download/' + d.token;

    var head = '<tr>' + d.columns.map(function (c) {
      return '<th>' + esc(c) + '</th>';
    }).join('') + '</tr>';
    var body = d.rows.map(function (r) {
      return '<tr>' + r.map(function (v) {
        return '<td>' + esc(v) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    document.getElementById('preview').innerHTML = head + body;
    document.getElementById('result').classList.remove('hidden');
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
</script>
</body>
</html>
`;

const REQUIREMENTS = String.raw`fastapi>=0.110
uvicorn[standard]>=0.29
openai>=1.40.0
pandas>=2.0
openpyxl>=3.1
PyYAML>=6.0
python-multipart>=0.0.9
`;

const ENV_EXAMPLE = String.raw`# API-ключ DashScope (Alibaba Cloud Model Studio)
# Получить ключ: https://dashscope.console.aliyun.com
# Международный портал: https://www.alibabacloud.com/en/solutions/generative-ai/bailian
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
`;

const README = String.raw`# Qwen Excel Bridge

Веб-сервис на Python: принимает Excel-файл, обрабатывает таблицу
моделью Qwen по предустановленному промту из prompt.yaml
и возвращает готовый .xlsx.

## Быстрый старт

1. Создайте окружение и установите зависимости:

       python -m venv .venv
       source .venv/bin/activate      # Windows: .venv\Scripts\activate
       pip install -r requirements.txt

2. Получите API-ключ DashScope:
   - Китай: https://dashscope.console.aliyun.com
   - Международный: Alibaba Cloud Model Studio (Bailian)

3. Настройте ключ:

       cp .env.example .env           # впишите DASHSCOPE_API_KEY=sk-...
       # Windows (без .env):  setx DASHSCOPE_API_KEY "sk-..."

4. Запустите сервер:

       uvicorn main:app --reload

5. Откройте http://127.0.0.1:8000 — загрузите .xlsx и скачайте результат.

## Структура проекта

    main.py               FastAPI: веб-интерфейс, /api/process, /api/download
    qwen_client.py        загрузка prompt.yaml + запрос к Qwen
                          (OpenAI-совместимый режим DashScope)
    excel_handler.py      чтение .xlsx в CSV-текст и сборка .xlsx из JSON
    prompt.yaml           сам промт и параметры модели —
                          правьте его, не трогая код
    templates/index.html  простой веб-интерфейс
                          (загрузка -> обработка -> скачивание)

## Как поменять поведение

Весь алгоритм обработки описан в prompt.yaml — секция user,
блок «Алгоритм». Поменяйте шаги или формат ответа, и сервис
начнёт обрабатывать таблицы по-новому; Python-код трогать не нужно.

Секция system задаёт роль модели, model / temperature / max_tokens —
параметры генерации, json_mode включает требование JSON-ответа.

## Ограничения

- В модель уходят первые 300 строк первого непустого листа (MAX_ROWS).
- Максимальный размер загружаемого файла — 10 МБ.
- Ответ модели ожидается в виде JSON: columns / rows / summary.
- .env в репозиторий не коммитьте — там лежит секретный ключ.
`;

export const PROJECT_FILES: ProjectFile[] = [
  {
    path: "main.py",
    lang: "python",
    note: "Точка входа: FastAPI, веб-интерфейс, приём файла, отдача результата",
    content: MAIN_PY,
  },
  {
    path: "qwen_client.py",
    lang: "python",
    note: "Читает prompt.yaml и вызывает Qwen через OpenAI-совместимый режим",
    content: QWEN_CLIENT_PY,
  },
  {
    path: "excel_handler.py",
    lang: "python",
    note: "pandas + openpyxl: .xlsx → CSV-текст → .xlsx из JSON-ответа",
    content: EXCEL_HANDLER_PY,
  },
  {
    path: "prompt.yaml",
    lang: "yaml",
    note: "Предустановленный промт и параметры модели — правится без кода",
    content: PROMPT_YAML,
  },
  {
    path: "templates/index.html",
    lang: "html",
    note: "Простой веб-интерфейс: drag-and-drop, обработка, скачивание",
    content: INDEX_HTML,
  },
  {
    path: "requirements.txt",
    lang: "text",
    note: "Зависимости Python",
    content: REQUIREMENTS,
  },
  {
    path: ".env.example",
    lang: "bash",
    note: "Шаблон переменной окружения с ключом DashScope",
    content: ENV_EXAMPLE,
  },
  {
    path: "README.md",
    lang: "text",
    note: "Быстрый старт, структура проекта, ограничения",
    content: README,
  },
];

export const ZIP_ROOT = "qwen-excel-bridge";
