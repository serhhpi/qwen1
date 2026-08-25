# Qwen × Excel — обработчик таблиц

Мини-сервис на Python: веб-интерфейс принимает несколько Excel-файлов,
подставляет их содержимое в предустановленный промпт из promt.yaml,
отправляет запрос в Qwen (DashScope, OpenAI-совместимый API) и отдаёт
результат новым Excel-файлом, собранным по алгоритму из промпта.

## Структура проекта

    qwen-excel-processor/
    ├── app.py              # Flask-сервер, маршруты /, /api/process, /download
    ├── qwen_client.py      # клиент Qwen (DashScope) + разбор JSON-ответа
    ├── excel_io.py         # чтение Excel -> текст, JSON -> готовый .xlsx
    ├── promt.yaml          # предустановленные промпты и настройки модели
    ├── requirements.txt    # зависимости
    ├── .env.example        # шаблон файла с ключом
    └── templates/
        └── index.html      # веб-интерфейс (загрузка файлов, выбор промпта)

## Быстрый старт

1. Установите Python 3.10 или новее. Проверка:

       python --version

2. Распакуйте проект и перейдите в папку:

       cd qwen-excel-processor

3. Создайте и активируйте виртуальное окружение.

   Windows (cmd):

       python -m venv .venv
       .venv\Scripts\activate

   Windows (PowerShell):

       python -m venv .venv
       .venv\Scripts\Activate.ps1

   macOS / Linux:

       python3 -m venv .venv
       source .venv/bin/activate

4. Установите зависимости:

       pip install -r requirements.txt

5. Получите API-ключ Qwen в консоли DashScope
   (https://dashscope.console.aliyun.com, раздел API-KEY)
   и передайте его программе — любым из двух способов.

   Переменная окружения (macOS / Linux):

       export DASHSCOPE_API_KEY=sk-ваш-ключ

   Переменная окружения (Windows, cmd):

       set DASHSCOPE_API_KEY=sk-ваш-ключ

   Либо файл .env в папке проекта (скопируйте .env.example):

       DASHSCOPE_API_KEY=sk-ваш-ключ

6. Запустите сервер:

       python app.py

7. Откройте в браузере http://127.0.0.1:5000 — загрузите Excel-файлы,
   выберите промпт и скачайте готовый отчёт.

## Как поменять алгоритм обработки

Откройте promt.yaml:

- секция prompts — сами промпты: ключ, подпись (label), системная часть
  (system) и пользовательская (user);
- плейсхолдеры {tables}, {files} и {files_count} подставляются
  автоматически — вокруг них и пишите свой алгоритм по шагам;
- default_prompt — какой промпт выбран по умолчанию;
- model / temperature / max_tokens — параметры модели
  (qwen-turbo, qwen-plus, qwen-max).

Главное требование к промпту — модель должна вернуть JSON вида:

    {
      "sheets": [
        {"name": "Лист", "headers": ["а", "б"], "rows": [["1", "2"]]}
      ]
    }

Сервер сам превратит этот JSON в отформатированный .xlsx.
Правки promt.yaml подхватываются без перезапуска сервера.

## Ограничения и настройки

- форматы на входе: .xlsx, .xls, .xlsm, .csv (константа ALLOWED_EXT);
- до 10 файлов за запрос, до 15 МБ каждый (MAX_FILES, MAX_FILE_MB);
- в модель уходит не более 400 строк с листа и 60 000 символов суммарно
  (MAX_ROWS_PER_SHEET, MAX_TABLE_CHARS в excel_io.py) — иначе большие
  таблицы не влезут в контекст;
- исходные файлы удаляются сразу после ответа;
- для Китая задайте QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1.

## Возможные ошибки

- «не задан DASHSCOPE_API_KEY» — переменная не видна процессу:
  устанавливайте её в том же терминале, где запускаете python app.py,
  либо используйте .env;
- 401 / Invalid API key — ключ недействителен или выдан для другого
  региона: сверьте endpoint (международный или китайский);
- «в ответе модели нет JSON» — ужесточите формулировку «верни только
  JSON» в промпте, поставьте temperature: 0 и модель qwen-max.
