import os
import yaml
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pandas as pd
from openpyxl import Workbook
import dashscope
from io import BytesIO

# --- Настройки ---
app = FastAPI()
templates = Jinja2Templates(directory="templates")

# Укажите ваш API-ключ DashScope (Qwen) здесь
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "YOUR_DASHSCOPE_API_KEY")
dashscope.api_key = DASHSCOPE_API_KEY

PROMPT_FILE_PATH = "prompts.yaml"
UPLOAD_DIR = "uploads"
RESULT_DIR = "results"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

# --- Загрузка промта ---
def load_prompt(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return data.get('default_prompt', '')

prompt_text = load_prompt(PROMPT_FILE_PATH)

# --- Обработка через Qwen ---
def call_qwen_with_excel_data(df_str):
    messages = [
        {
            "role": "system",
            "content": prompt_text
        },
        {
            "role": "user",
            "content": f"Данные из Excel:\n{df_str}\n\nПроанализируй их и верни результат."
        }
    ]

    try:
        response = dashscope.Generation.call(
            model='qwen-max',
            messages=messages,
            result_format='message'
        )
        if response.status_code == 200:
            return response.output.choices[0].message.content
        else:
            raise Exception(f"Ошибка DashScope: {response.code}, {response.message}")
    except Exception as e:
        print(f"Ошибка вызова Qwen: {e}")
        return f"Ошибка: {str(e)}"

# --- Роуты ---
@app.get("/", response_class=HTMLResponse)
async def main_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/process", response_class=FileResponse)
async def process_file(request: Request, file: UploadFile = File(...)):
    # 1. Сохранить загруженный файл
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    # 2. Прочитать Excel
    df = pd.read_excel(file_location)
    df_str = df.to_csv(index=False) # Преобразуем в строку для отправки в промт

    # 3. Вызвать Qwen
    qwen_response = call_qwen_with_excel_data(df_str)

    # 4. Парсинг ответа Qwen в DataFrame (пример, адаптируйте под ваш формат)
    # Предположим, что Qwen возвращает CSV-подобный формат
    try:
        # Если Qwen возвращает чистый CSV-текст
        result_df = pd.read_csv(BytesIO(qwen_response.encode()))
    except Exception:
        # Если Qwen возвращает текст с пояснениями, нужно его очистить
        # или использовать регулярные выражения для извлечения табличных данных
        # Это зависит от содержания промта и ожидаемого формата
        # Пока просто создадим DataFrame из сырого ответа
        result_df = pd.DataFrame({'Output': [qwen_response]})

    # 5. Сохранить результат как Excel
    output_filename = f"result_{file.filename.split('.')[0]}.xlsx"
    output_path = os.path.join(RESULT_DIR, output_filename)
    
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        result_df.to_excel(writer, sheet_name='Sheet1', index=False)

    # 6. Вернуть файл пользователю
    return FileResponse(path=output_path, filename=output_filename, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
