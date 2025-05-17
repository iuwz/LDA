"""
Universal OpenAI helper – 100 % async-friendly.

Changes in this version
-----------------------
• Models whose API expects *max_completion_tokens* (e.g. “o4-mini”) are
  handled transparently – callers may still pass **max_tokens** or
  **max_completion_tokens** and the helper renames the parameter
  automatically.
• Works for both async (call_gpt) and sync (call_gpt_sync) variants.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional, Iterator, AsyncIterator

from dotenv import load_dotenv
from openai import OpenAI, AsyncOpenAI

# ─────────────────────────── env / logging ────────────────────────────
load_dotenv()
logger = logging.getLogger(__name__)

# ────────────────────────── OpenAI clients ────────────────────────────
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
async_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ────────────────────────── helper utilities ──────────────────────────
_CHAT_PREFIXES = (
    "gpt-3.5-",
    "gpt-4",
    "o3",
    "o4-mini",
    "o4-mini-high",
    "gpt-4o",
)


def _is_chat_model(name: str) -> bool:
    """Return True if *name* is a chat/completions model."""
    return any(name.startswith(p) for p in _CHAT_PREFIXES)


def _consume_stream(stream: Iterator[Any], is_chat: bool) -> str:
    """Concatenate blocking stream chunks into a single string."""
    parts: list[str] = []
    for ev in stream:
        parts.append(
            ev.choices[0].delta.content if is_chat else ev.choices[0].text or ""
        )
    return "".join(parts).strip()


async def _consume_async_stream(stream: AsyncIterator[Any], is_chat: bool) -> str:
    """Concatenate async streaming chunks into a single string."""
    parts: list[str] = []
    async for ev in stream:
        parts.append(
            ev.choices[0].delta.content if is_chat else ev.choices[0].text or ""
        )
    return "".join(parts).strip()


# Known token limits (update as new models appear)
_MODEL_LIMITS: dict[str, int] = {
    # Chat models
    "gpt-3.5-turbo": 4096,
    "gpt-3.5-turbo-16k": 16384,
    "gpt-4": 8192,
    "gpt-4-32k": 32768,
    "o3": 8192,
    "o4-mini": 16384,
    "o4-mini-high": 16384,
    "gpt-4o": 8192,
    # Legacy completion
    "text-davinci-003": 4096,
    "text-davinci-002": 4096,
    "code-davinci-002": 8000,
}


def _default_cap(model: str) -> int:
    """Return documented max-token capacity for *model* (fallback 8192)."""
    for m, lim in _MODEL_LIMITS.items():
        if model.startswith(m):
            return lim
    return 8192


def _token_param(model: str) -> str:
    """
    Return correct parameter name for the chosen model.

    OpenAI’s newer “o4-*” family rejects ‘max_tokens’ and requires
    ‘max_completion_tokens’. Classic GPT models expect ‘max_tokens’.
    """
    return "max_completion_tokens" if model.startswith("o4-") else "max_tokens"


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
    Asynchronous OpenAI helper.

    The function is backwards-compatible: callers may supply either
    max_tokens=… or max_completion_tokens=….  The correct parameter name
    is forwarded to OpenAI automatically.
    """
    try:
        is_chat = _is_chat_model(model)
        kwargs: Dict[str, Any] = {"model": model}

        # ----- token-limit handling -------------------------------------
        param_name = _token_param(model)

        # precedence:
        #   1) explicit kwarg (max_completion_tokens)
        #   2) extras dict (max_completion_tokens or max_tokens)
        #   3) model default
        limit = (
            max_completion_tokens
            if max_completion_tokens is not None
            else openai_extra.pop("max_completion_tokens", None)
            or openai_extra.pop("max_tokens", None)
            or _default_cap(model)
        )
        kwargs[param_name] = limit

        # ----- temperature (o4-mini ignores custom temps) ---------------
        if temperature is not None and not model.startswith("o4-mini"):
            kwargs["temperature"] = temperature

        # pass-through any other recognised extras (stream, response_format…)
        kwargs.update(openai_extra)

        # ----- chat models ---------------------------------------------
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

        # ----- legacy completion models ---------------------------------
        full_prompt = (
            f"{system_message.strip()}\n\n{prompt}" if system_message else prompt
        )
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
    Blocking helper retained for CLI scripts or places without async/await.

    Same token-parameter normalisation logic as the async variant.
    """
    try:
        is_chat = _is_chat_model(model)
        kwargs: Dict[str, Any] = {"model": model}

        # ----- token-limit handling -------------------------------------
        param_name = _token_param(model)
        limit = (
            max_completion_tokens
            if max_completion_tokens is not None
            else openai_extra.pop("max_completion_tokens", None)
            or openai_extra.pop("max_tokens", None)
            or _default_cap(model)
        )
        kwargs[param_name] = limit

        # ----- temperature ---------------------------------------------
        if temperature is not None and not model.startswith("o4-mini"):
            kwargs["temperature"] = temperature

        kwargs.update(openai_extra)

        # ----- chat models ---------------------------------------------
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

        # ----- legacy completion models ---------------------------------
        full_prompt = (
            f"{system_message.strip()}\n\n{prompt}" if system_message else prompt
        )
        kwargs["prompt"] = full_prompt

        if kwargs.get("stream"):
            stream = client.completions.create(**kwargs)
            return _consume_stream(stream, is_chat=False)

        resp = client.completions.create(**kwargs)
        return (resp.choices[0].text or "").strip()

    except Exception as e:
        logger.error("Sync OpenAI call failed: %s", e, exc_info=True)
        return ""