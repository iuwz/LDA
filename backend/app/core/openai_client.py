# app/core/openai_client.py
import os
from dotenv import load_dotenv
from openai import OpenAI

# ──────────────────────────────────────────────────────────────
load_dotenv()                               # pulls secrets from .env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# ──────────────────────────────────────────────────────────────

def call_gpt(
    prompt: str,
    system_message: str | None = None,
    *,
    model: str = "o4-mini",
    temperature: float | None = None,
) -> str | None:
    """
    Convenience wrapper for OpenAI chat-completions.

    Parameters
    ----------
    prompt : str
        The user prompt to send to the assistant.
    system_message : str, optional
        A system message that frames the assistant’s behaviour.
    model : str, default ``"o4-mini"``
        Model to use (e.g. ``"gpt-3.5-turbo"``, ``"gpt-4o"``, ``"o4-mini"`` …).
    temperature : float or None
        Sampling temperature. **Ignored for o4-mini / o4** because those
        models only accept the default value 1.

    Returns
    -------
    str | None
        Assistant’s reply, or ``None`` if an exception occurred.
    """
    try:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        # Build kwargs dynamically so we can omit temperature when forbidden
        chat_kwargs = {"model": model, "messages": messages}

        # Only attach temperature for models that support custom values
        if model not in {"o4-mini", "o4"} and temperature is not None:
            chat_kwargs["temperature"] = temperature

        response = client.chat.completions.create(**chat_kwargs)
        return response.choices[0].message.content.strip()

    except Exception as e:
        # Replace with proper logging if desired
        print(f"Error calling GPT: {e}")
        return None
