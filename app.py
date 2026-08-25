# -*- coding: utf-8 -*-
"""
Qwen Excel Processor — веб-сервер на Flask.

Принимает несколько Excel-файлов через веб-интерфейс, подставляет их
содержимое в предустановленный промпт из promt.yaml, отправляет запрос
в Qwen (DashScope, OpenAI-совместимый API) и отдаёт результат в виде
нового Excel-файла, собранного по алгоритму из промпта.

Запуск:
    export DASHSCOPE_API_KEY=sk-xxxx      (Windows: set DASHSCOPE_API_KEY=sk-xxxx)
    python app.py
    -> http://127.0.0.1:5000
"""

import tempfile
import uuid
from gzip import GzipFile
from pathlib import Path

import yaml
from flask import Flask, jsonify, render_template, request, send_file
from werkzeug.utils import secure_filename

from excel_io import build_result_xlsx, read_workbooks, tables_to_text
# from qwen_client import QwenClient, QwenError
from giga_client import GigaChatClient,GigaChatError

BASE_DIR = Path(__file__).resolve().parent
PROMPT_FILE = BASE_DIR / "promt.yaml"

ALLOWED_EXT = {".xlsx", ".xls", ".xlsm", ".csv"}
MAX_FILES = 10          # сколько файлов можно прислать за один раз
MAX_FILE_MB = 15        # лимит на один файл

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_FILES * MAX_FILE_MB * 1024 * 1024

# Временная папка для готовых отчётов (очищается при перезапуске ОС)
# OUT_DIR = Path(tempfile.gettempdir()) / "qwen_excel_out"
OUT_DIR = Path().parent / "qwen_excel_out"
OUT_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
#  Промпты из promt.yaml
# ---------------------------------------------------------------------------
def load_prompt_config() -> dict:
    """Читает promt.yaml заново при каждом запросе — правки подхватываются
    без перезапуска сервера."""
    if not PROMPT_FILE.exists():
        raise FileNotFoundError(f"Не найден файл промптов: {PROMPT_FILE}")
    with open(PROMPT_FILE, "r", encoding="utf-8") as fh:
        config = yaml.safe_load(fh) or {}
    if "prompts" not in config or not config["prompts"]:
        raise ValueError("В promt.yaml нет ни одного промпта (секция prompts)")
    config.setdefault("default_prompt", next(iter(config["prompts"])))
    config.setdefault("model", "qwen-plus")
    config.setdefault("temperature", 0.1)
    config.setdefault("max_tokens", 8000)
    return config


# ---------------------------------------------------------------------------
#  Маршруты
# ---------------------------------------------------------------------------
@app.get("/")
def index():
    """Веб-интерфейс: загрузка файлов и выбор промпта."""
    config = load_prompt_config()
    prompts = [
        {"id": key, "label": value.get("label", key)}
        for key, value in config["prompts"].items()
    ]
    return render_template(
        "index.html",
        prompts=prompts,
        default_prompt=config["default_prompt"],
        model=config["model"],
        max_files=MAX_FILES,
    )


@app.get("/api/prompts")
def api_prompts():
    """Список доступных промптов (для своих фронтендов и скриптов)."""
    config = load_prompt_config()
    return jsonify({"prompts": config["prompts"], "default": config["default_prompt"]})


@app.post("/api/process")
def api_process():
    """
    Принимает multipart/form-data:
        files[]    — один или несколько Excel-файлов
        prompt_id  — ключ промпта из promt.yaml (необязательно)
    Возвращает JSON: { ok, download_url, preview }
    """
    uploads = request.files.getlist("files[]") or request.files.getlist("files")
    if not uploads:
        return jsonify(ok=False, error="Пришлите хотя бы один файл (поле files[])"), 400
    if len(uploads) > MAX_FILES:
        return jsonify(ok=False, error=f"Не больше {MAX_FILES} файлов за раз"), 400

    saved = []
    for f in uploads:
        name = secure_filename(f.filename or "file")
        ext = Path(name).suffix.lower()
        if ext not in ALLOWED_EXT:
            return jsonify(ok=False, error=f"Формат не поддерживается: {name}"), 400
        tmp = OUT_DIR / f"{uuid.uuid4().hex}{ext}"
        f.save(tmp)
        saved.append(tmp)

    try:
        config = load_prompt_config()
        prompt_id = request.form.get("prompt_id") or config["default_prompt"]
        prompt = config["prompts"].get(prompt_id)
        if prompt is None:
            return jsonify(ok=False, error=f"Промпт '{prompt_id}' не найден в promt.yaml"), 400

        # 1. Читаем таблицы из всех файлов
        workbooks = read_workbooks(saved)
        tables_text = tables_to_text(workbooks)
        file_names = ", ".join(wb["file"] for wb in workbooks)

        # 2. Собираем промпт: подставляем данные в шаблон из promt.yaml
        user_prompt = (
            prompt["user"]
            .replace("{tables}", tables_text)
            .replace("{files}", file_names)
            .replace("{files_count}", str(len(workbooks)))
        )

        # 3. Запрос к Qwen
        # client = QwenClient()
        client = GigaChatClient()
        answer = client.chat(
            system=prompt.get("system", ""),
            user=user_prompt,
            model=config["model"],
            temperature=float(config["temperature"]),
            max_tokens=int(config["max_tokens"]),
        )

        # 4. Разбираем JSON-ответ и собираем итоговый Excel
        # payload = QwenClient.extract_json(answer)
        payload = GigaChatClient.extract_json(answer)
        result_path = OUT_DIR / f"result_{uuid.uuid4().hex[:10]}.xlsx"
        build_result_xlsx(payload, result_path)

        preview = [
            {"sheet": s.get("name", f"Лист {i + 1}"), "rows": len(s.get("rows", []))}
            for i, s in enumerate(payload.get("sheets", []))
        ]
        return jsonify(ok=True, download_url=f"/download/{result_path.name}", preview=preview)

    # except QwenError as exc:
    except GigaChatError as exc:
        return jsonify(ok=False, error=f"Qwen API: {exc}"), 502
    except (ValueError, KeyError) as exc:
        return jsonify(ok=False, error=f"Не удалось разобрать ответ модели: {exc}"), 502
    finally:
        for tmp in saved:  # исходные файлы не храним
            tmp.unlink(missing_ok=True)


@app.get("/download/<path:filename>")
def download(filename):
    """Отдаёт готовый Excel-файл."""
    path = OUT_DIR / secure_filename(filename)
    if not path.exists():
        return jsonify(ok=False, error="Файл не найден (сервер перезапускался?)"), 404
    return send_file(path, as_attachment=True, download_name="otchet_qwen.xlsx")


if __name__ == "__main__":
    print(" * Промпты читаются из", PROMPT_FILE)
    app.run(host="127.0.0.1", port=5000, debug=False)
