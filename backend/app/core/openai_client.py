# backend/app/core/openai_client.py
"""
Universal OpenAI helper (back-compatible with *all* existing calls).

Keeps the old signature (prompt, system_message, model …) but now also
accepts **openai_extra so that other modules can pass modern parameters
such as  response_format ,  seed , top_p , stream=True  … without having
to touch this file again.
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
logger = logging.getLogger(__name__)

# Instantiate once – thread-safe in OpenAI 1.x
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def call_gpt(
    prompt: str,
    system_message: Optional[str] = None,
    *,
    model: str = "gpt-3.5-turbo",
    temperature: Optional[float] = None,
    max_completion_tokens: Optional[int] = None,
    **openai_extra: Any,            # ← NEW – keeps the wrapper future-proof
) -> Optional[str]:
    """
    Send a chat-completion and return the assistant’s *string* reply.

    Parameters
    ----------
    prompt : str
    system_message : str | None
    model : str
    temperature : float | None
    max_completion_tokens : int | None
    **openai_extra : Any
        Any additional keyword arguments accepted by the OpenAI client,
        e.g.  response_format ,  seed ,  top_p ,  stream=True  …

    Returns
    -------
    str | None
    """
    try:
        msgs: list[dict[str, str]] = []
        if system_message:
            msgs.append({"role": "system", "content": system_message})
        msgs.append({"role": "user", "content": prompt})

        kwargs: Dict[str, Any] = {"model": model, "messages": msgs}

        # Some OpenAI “o4-mini” style models ignore temperature
        if temperature is not None:
            kwargs["temperature"] = temperature

        # Align with OpenAI-python v1.x naming
        if max_completion_tokens is not None:
            kwargs["max_tokens"] = max_completion_tokens

        # merge in any forward-compat extras
        kwargs.update(openai_extra)

        resp = client.chat.completions.create(**kwargs)
        return (resp.choices[0].message.content or "").strip()

    except Exception as e:  # pragma: no cover
        logger.error("OpenAI call failed: %s", e, exc_info=True)
        return None