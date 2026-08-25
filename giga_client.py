# -*- coding: utf-8 -*-
"""
Клиент GigaChat (Sber) через langchain-gigachat.

Учётные данные (Authorization key) берутся из переменной окружения
GIGACHAT_CREDENTIALS или из файла .env рядом с app.py. Получить ключ:
https://developers.sber.ru/portal/products/gigachat (раздел GigaChat API).

Для корпоративной среды Sber Sigma дополнительно задаются:
    GIGACHAT_AUTH_URL  — адрес OAuth-сервера
    GIGACHAT_BASE_URL  — адрес API GigaChat

os.environ["GIGACHAT_AUTH_URL"] = "https://sm-auth-sd.prom-88-89-apps.ocp-geo.ocp.sigma.sbrf.ru/api/v2/oauth"
os.environ["GIGACHAT_API_URL"] = "https://gigachat.devices.sberbank.ru/api/v1/"
"""

import json
import os
import re
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_gigachat.chat_models import GigaChat

try:  # необязательный .env
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

DEFAULT_SCOPE = "GIGACHAT_API_CORP"
DEFAULT_MODEL = "GigaChat-2-Max"
DEFAULT_BASE_URL = "https://gigachat.devices.sberbank.ru/api/v1"
DEFAULT_TIMEOUT = 120


class GigaChatError(RuntimeError):
    """Ошибки обращения к GigaChat API."""


class GigaChatClient:
    def __init__(
        self,
        credentials: str | None = None,
        scope: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        auth_url: str | None = None,
    ):
        self.credentials = (
            credentials
            or os.getenv("GIGACHAT_CREDENTIALS", "").strip()
        )
        if not self.credentials:
            raise GigaChatError(
                "не заданы GIGACHAT_CREDENTIALS. Выполните "
                "export GIGACHAT_CREDENTIALS=<ключ> или создайте .env"
            )

        self.scope = scope or os.getenv("GIGACHAT_SCOPE", DEFAULT_SCOPE)
        self.model = model or os.getenv("GIGACHAT_MODEL", DEFAULT_MODEL)
        self.base_url = base_url or os.getenv("GIGACHAT_BASE_URL", DEFAULT_BASE_URL)
        self.auth_url = auth_url or os.getenv("GIGACHAT_AUTH_URL", "").strip() or None

        kwargs = dict(
            credentials=self.credentials,
            scope=self.scope,
            model=self.model,
            base_url=self.base_url,
            temperature=0.1,
            top_p=0.1,
            profanity_check=False,
            verify_ssl_certs=False,
            timeout=DEFAULT_TIMEOUT,
            streaming=False,
            model_kwargs={"top_p": 0.1},
        )
        if self.auth_url:
            kwargs["auth_url"] = self.auth_url

        try:
            self.client = GigaChat(**kwargs)
        except Exception as exc:  # неверный ключ, сеть, SSL...
            raise GigaChatError(str(exc)) from exc

    def chat(
        self,
        system: str,
        user: str,
        model: str | None = None,
        temperature: float = 0.1,
        max_tokens: int = 8000,
    ) -> str:
        """Один запрос к модели. Возвращает сырой текст ответа."""
        messages = []
        if system:
            messages.append(SystemMessage(content=system))
        messages.append(HumanMessage(content=user))

        try:
            response = self.client.invoke(
                messages
                # model=model or self.model,
                # temperature=temperature,
                # max_tokens=max_tokens,
            )
        except Exception as exc:  # сеть, 401, лимиты, таймауты...
            raise GigaChatError(str(exc)) from exc

        text = (getattr(response, "content", "") or "").strip()
        if not text:
            raise GigaChatError("модель вернула пустой ответ")
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
