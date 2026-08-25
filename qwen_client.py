# -*- coding: utf-8 -*-
"""
Клиент Qwen через OpenAI-совместимый endpoint DashScope.

API-ключ берётся из переменной окружения DASHSCOPE_API_KEY
или из файла .env рядом с app.py. Получить ключ:
https://dashscope.console.aliyun.com  (раздел API-KEY).
"""

import json
import os
import re
from pathlib import Path

from openai import OpenAI

try:  # необязательный .env
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

# Международный endpoint (по умолчанию):
#   https://dashscope-intl.aliyuncs.com/compatible-mode/v1
# Для Китая:
#   https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"


class QwenError(RuntimeError):
    """Ошибки обращения к Qwen API."""


class QwenClient:
    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY", "").strip()
        if not self.api_key:
            raise QwenError(
                "не задан DASHSCOPE_API_KEY. Выполните "
                "export DASHSCOPE_API_KEY=sk-... или создайте .env"
            )
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=base_url or os.getenv("QWEN_BASE_URL", DEFAULT_BASE_URL),
        )

    def chat(
        self,
        system: str,
        user: str,
        model: str = "qwen-plus",
        temperature: float = 0.1,
        max_tokens: int = 8000,
    ) -> str:
        """Один запрос к модели. Возвращает сырой текст ответа."""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": user})
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except Exception as exc:  # сеть, 401, лимиты, таймауты...
            raise QwenError(str(exc)) from exc

        text = (response.choices[0].message.content or "").strip()
        if not text:
            raise QwenError("модель вернула пустой ответ")
        return text

    @staticmethod
    def extract_json(text: str) -> dict:
        """
        Достаёт JSON из ответа модели: срезает markdown-заборы,
        находит первую сбалансированную {...} конструкцию и парсит её.
        Ожидаемая схема: {"sheets": [{"name", "headers", "rows"}]}
        """
        fence = re.search(r"```(?:json)?\s*(.+?)```", text, re.S)
        candidate = fence.group(1) if fence else text

        start = candidate.find("{")
        if start == -1:
            raise ValueError("в ответе модели нет JSON-объекта")

        depth, end = 0, -1
        for i, ch in enumerate(candidate[start:], start):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        if end == -1:
            raise ValueError("JSON в ответе модели не сбалансирован")

        payload = json.loads(candidate[start : end + 1])
        if "sheets" not in payload:
            raise ValueError('в JSON модели нет ключа "sheets"')
        return payload
