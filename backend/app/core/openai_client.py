# backend/app/core/openai_client.py
"""
Universal OpenAI helper – **back-compatible with both chat- and
completion-style models**.

Keeps the historical (prompt, system_message, model …) signature but
also forwards every unknown keyword via **openai_extra so that callers
can use new OpenAI parameters ( response_format , seed , stream=True …)
without having to touch this wrapper again.
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict, Optional, Iterator, Union

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
logger = logging.getLogger(__name__)

# One global client – thread-safe in OpenAI-python ≥1.0
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ──────────────────────────────────────────────────────────────
def _is_chat_model(name: str) -> bool:
    """
    Rough heuristic: anything that starts with “gpt-” (or a fine-tune on such)
    is treated as chat. Everything else is assumed to be a legacy completion
    model like text-davinci-003.
    """
    return name.startswith("gpt-") or name.startswith("ft:gpt-") or name.startswith("gpt_")


def _consume_stream(stream: Iterator[Any], is_chat: bool) -> str:
    """
    Helper to concatenate streaming chunks into one string so that callers
    still receive a plain str – keeps the original call_gpt contract intact.
    """
    parts: list[str] = []
    for ev in stream:
        if is_chat:
            parts.append(ev.choices[0].delta.content or "")
        else:  # completion
            parts.append(ev.choices[0].text or "")
    return "".join(parts).strip()


# ──────────────────────────────────────────────────────────────
def call_gpt(
    prompt: str,
    system_message: Optional[str] = None,
    *,
    model: str = "gpt-3.5-turbo",
    temperature: Optional[float] = None,
    max_completion_tokens: Optional[int] = None,
    **openai_extra: Any,  # ← keeps the wrapper future-proof
) -> Optional[str]:
    """
    Send a request to OpenAI and return the assistant’s reply as *str*.

    Works with both chat-completion models (gpt-*) and classic completion
    models (text-davinci-003, etc.).  If stream=True is supplied in
    **openai_extra, the stream is internally consumed and the concatenated
    result is returned so downstream code still receives a single string.
    """
    try:
        is_chat = _is_chat_model(model)

        # ── common kwargs ─────────────────────────────────────────
        kwargs: Dict[str, Any] = {"model": model}

        # Default output length: allow large JSON responses
        default_max = 8000
        if max_completion_tokens is not None:
            kwargs["max_tokens"] = max_completion_tokens
        elif "max_tokens" not in openai_extra:
            kwargs["max_tokens"] = default_max

        if temperature is not None:
            kwargs["temperature"] = temperature

        # merge any forward-compat arguments
        kwargs.update(openai_extra)

        stream = bool(kwargs.get("stream"))

        # ── chat branch ───────────────────────────────────────────
        if is_chat:
            messages: list[dict[str, str]] = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})
            kwargs["messages"] = messages

            if stream:
                s = client.chat.completions.create(**kwargs)
                return _consume_stream(s, is_chat=True)

            resp = client.chat.completions.create(**kwargs)
            return (resp.choices[0].message.content or "").strip()

        # ── legacy completion branch ─────────────────────────────
        full_prompt: str = prompt
        if system_message:
            # Prepend system_message in a simple “instruction + prompt” format
            full_prompt = f"{system_message.strip()}\n\n{prompt}"

        kwargs["prompt"] = full_prompt

        if stream:
            s = client.completions.create(**kwargs)
            return _consume_stream(s, is_chat=False)

        resp = client.completions.create(**kwargs)
        return (resp.choices[0].text or "").strip()

    # ── global error guard ────────────────────────────────────────
    except Exception as e:  # pragma: no cover
        logger.error("OpenAI call failed: %s", e, exc_info=True)
        return None