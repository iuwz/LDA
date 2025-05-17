"""
Universal OpenAI helper – now 100 % async-friendly.

Highlights
----------
• `call_gpt`  —— asynchronous  (uses openai.AsyncOpenAI)
• `call_gpt_sync` —— blocking   (uses openai.OpenAI)

The signature is identical for both helpers, so migrating callers is
trivial: add / remove `await` as appropriate.

If you keep only async usage in your code-base you may delete the sync
helper, but retaining it does no harm.
"""
from __future__ import annotations

import logging
import os
import re
import json
from typing import Any, Dict, Optional, Iterator, AsyncIterator

from dotenv import load_dotenv
from openai import OpenAI, AsyncOpenAI

# ─────────────────────────── env / logging ────────────────────────────
load_dotenv()
logger = logging.getLogger(__name__)

# ────────────────────────── OpenAI clients ────────────────────────────
client        = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
async_client  = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ────────────────────────── helper utilities ──────────────────────────
_CHAT_PREFIXES = (
    "gpt-3.5-", "gpt-4", "o3", "o4-mini", "o4-mini-high", "gpt-4o"
)

def _is_chat_model(name: str) -> bool:
    """Return True if *name* is a chat/completions model."""
    return any(name.startswith(p) for p in _CHAT_PREFIXES)


def _consume_stream(stream: Iterator[Any], is_chat: bool) -> str:
    """Concatenate blocking stream chunks into a single string."""
    parts: list[str] = []
    for ev in stream:
        if is_chat:
            parts.append(ev.choices[0].delta.content or "")
        else:
            parts.append(ev.choices[0].text or "")
    return "".join(parts).strip()


async def _consume_async_stream(stream: AsyncIterator[Any], is_chat: bool) -> str:
    """Concatenate async streaming chunks into a single string."""
    parts: list[str] = []
    async for ev in stream:
        if is_chat:
            parts.append(ev.choices[0].delta.content or "")
        else:
            parts.append(ev.choices[0].text or "")
    return "".join(parts).strip()


# Known token limits (update as new models appear)
_MODEL_LIMITS: dict[str, int] = {
    # Chat models
    "gpt-3.5-turbo":        4096,
    "gpt-3.5-turbo-16k":   16384,
    "gpt-4":                8192,
    "gpt-4-32k":           32768,
    "o3":                   8192,
    "o4-mini":             16384,
    "o4-mini-high":        16384,
    "gpt-4o":               8192,
    # Legacy completion
    "text-davinci-003":     4096,
    "text-davinci-002":     4096,
    "code-davinci-002":     8000,
}

def _default_cap(model: str) -> int:
    """Return documented max-token capacity for *model* (fallback 8192)."""
    for m, lim in _MODEL_LIMITS.items():
        if model.startswith(m):
            return lim
    return 8192


# ═════════════════════════════ ASYNC ══════════════════════════════════
async def call_gpt(
    prompt: str,
    system_message: Optional[str] = None,
    *,
    model: str = "o4-mini",
    temperature: Optional[float] = None,
    max_completion_tokens: Optional[int] = None,
    **openai_extra: Any,
) -> str:
    """
    Asynchronous OpenAI helper – await this in your FastAPI handlers.

    The parameter semantics are identical to the former synchronous helper.
    """
    try:
        is_chat = _is_chat_model(model)
        kwargs: Dict[str, Any] = {"model": model}

        # ----- max_tokens handling -----------------------------------------
        if max_completion_tokens is not None:
            kwargs["max_tokens"] = max_completion_tokens
        elif "max_tokens" in openai_extra:
            kwargs["max_tokens"] = openai_extra.pop("max_tokens")
        else:
            kwargs["max_tokens"] = _default_cap(model)

        # ----- temperature (o4-mini ignores custom temps) ------------------
        if temperature is not None and not model.startswith("o4-mini"):
            kwargs["temperature"] = temperature

        # pass-through any other recognised extras (response_format, etc.)
        kwargs.update(openai_extra)

        # ----- chat models -------------------------------------------------
        if is_chat:
            messages: list[dict[str, str]] = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})
            kwargs["messages"] = messages

            if kwargs.get("stream"):
                stream = await async_client.chat.completions.create(**kwargs)
                return await _consume_async_stream(stream, is_chat=True)

            resp = await async_client.chat.completions.create(**kwargs)
            return (resp.choices[0].message.content or "").strip()

        # ----- legacy completion models ------------------------------------
        full_prompt = f"{system_message.strip()}\n\n{prompt}" if system_message else prompt
        kwargs["prompt"] = full_prompt

        if kwargs.get("stream"):
            stream = await async_client.completions.create(**kwargs)
            return await _consume_async_stream(stream, is_chat=False)

        resp = await async_client.completions.create(**kwargs)
        return (resp.choices[0].text or "").strip()

    except Exception as e:
        logger.error("Async OpenAI call failed: %s", e, exc_info=True)
        return ""


# ═══════════════════════════ SYNC (legacy) ════════════════════════════
def call_gpt_sync(
    prompt: str,
    system_message: Optional[str] = None,
    *,
    model: str = "o4-mini",
    temperature: Optional[float] = None,
    max_completion_tokens: Optional[int] = None,
    **openai_extra: Any,
) -> str:
    """
    Blocking helper retained for CLI scripts or places where async/await
    is unavailable.  The implementation mirrors `call_gpt`.
    """
    try:
        is_chat = _is_chat_model(model)
        kwargs: Dict[str, Any] = {"model": model}

        # ----- max_tokens handling -----------------------------------------
        if max_completion_tokens is not None:
            kwargs["max_tokens"] = max_completion_tokens
        elif "max_tokens" in openai_extra:
            kwargs["max_tokens"] = openai_extra.pop("max_tokens")
        else:
            kwargs["max_tokens"] = _default_cap(model)

        # ----- temperature -------------------------------------------------
        if temperature is not None and not model.startswith("o4-mini"):
            kwargs["temperature"] = temperature

        kwargs.update(openai_extra)

        # ----- chat models -------------------------------------------------
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
            return (resp.choices[0].message.content or "").strip()

        # ----- legacy completion models ------------------------------------
        full_prompt = f"{system_message.strip()}\n\n{prompt}" if system_message else prompt
        kwargs["prompt"] = full_prompt

        if kwargs.get("stream"):
            stream = client.completions.create(**kwargs)
            return _consume_stream(stream, is_chat=False)

        resp = client.completions.create(**kwargs)
        return (resp.choices[0].text or "").strip()

    except Exception as e:
        logger.error("Sync OpenAI call failed: %s", e, exc_info=True)
        return ""