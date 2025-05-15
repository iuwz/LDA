"""
Universal OpenAI helper – supports all known chat- and completion-style models.
Automatically caps tokens based on each model's documented limits.
"""
from __future__ import annotations
import os
import logging
from typing import Any, Dict, Optional, Iterator
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()
logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _is_chat_model(name: str) -> bool:
    """
    Determine if a model is a chat-style (chat/completions) model.
    """
    return any(
        name.startswith(prefix)
        for prefix in (
            "gpt-3.5-", "gpt-4", "o3", "o4-mini", "o4-mini-high", "gpt-4o"
        )
    )


def _consume_stream(stream: Iterator[Any], is_chat: bool) -> str:
    """
    Concatenate streaming chunks into a single string.
    """
    parts: list[str] = []
    for ev in stream:
        if is_chat:
            parts.append(ev.choices[0].delta.content or "")
        else:
            parts.append(ev.choices[0].text or "")
    return "".join(parts).strip()


def call_gpt(
    prompt: str,
    system_message: Optional[str] = None,
    *,
    model: str = "o4-mini",
    temperature: Optional[float] = None,
    max_completion_tokens: Optional[int] = None,
    **openai_extra: Any,
) -> str:
    """
    Send a request to OpenAI and return the assistant's reply as a string.

    Supports both chat (gpt-*) and legacy completion models, auto-capping
    messages per model's token limits.
    """
    try:
        is_chat = _is_chat_model(model)
        kwargs: Dict[str, Any] = {"model": model}

        # Known max token capacities for each model
        model_limits = {
            # Chat models
            "gpt-3.5-turbo":       4096,
            "gpt-3.5-turbo-16k":  16384,
            "gpt-4":               8192,
            "gpt-4-32k":          32768,
            "o3":                  8192,
            "o4-mini":            16384,
            "o4-mini-high":       16384,
            "gpt-4o":              8192,
            # Legacy completion models
            "text-davinci-003":    4096,
            "text-davinci-002":    4096,
            "code-davinci-002":    8000,
        }

        # Determine default cap based on model prefix
        cap: Optional[int] = None
        for m, limit in model_limits.items():
            if model.startswith(m):
                cap = limit
                break
        default_cap = cap if cap is not None else (8192 if is_chat else 4096)

        # 1️⃣ Explicit max_completion_tokens param
        if max_completion_tokens is not None:
            if is_chat:
                kwargs["max_completion_tokens"] = max_completion_tokens
            else:
                kwargs["max_tokens"] = max_completion_tokens
        # 2️⃣ Legacy 'max_tokens' in extras
        elif "max_tokens" in openai_extra:
            tok = openai_extra.pop("max_tokens")
            if is_chat:
                kwargs["max_completion_tokens"] = tok
            else:
                kwargs["max_tokens"] = tok
        # 3️⃣ Fallback to documented caps
        else:
            if is_chat:
                kwargs["max_completion_tokens"] = default_cap
            else:
                kwargs["max_tokens"] = default_cap

        # Temperature
        if temperature is not None:
            kwargs["temperature"] = temperature

        # Pass through other compatible params (response_format, stream, etc.)
        kwargs.update(openai_extra)

        # Chat-completion branch
        if is_chat:
            messages: list[dict[str, str]] = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})
            kwargs["messages"] = messages

            if kwargs.get("stream"):
                stream = client.chat.completions.create(**kwargs)
                return _consume_stream(stream, is_chat=True)
            resp = client.chat.completions.create(**kwargs)
            return resp.choices[0].message.content.strip()

        # Legacy completion branch
        full_prompt = prompt
        if system_message:
            full_prompt = f"{system_message.strip()}\n\n{prompt}"
        kwargs["prompt"] = full_prompt

        if kwargs.get("stream"):
            stream = client.completions.create(**kwargs)
            return _consume_stream(stream, is_chat=False)
        resp = client.completions.create(**kwargs)
        return resp.choices[0].text.strip()

    except Exception as e:
        logger.error("OpenAI call failed: %s", e, exc_info=True)
        return ""