# backend/app/core/openai_client.py
import os
from dotenv import load_dotenv
import openai

# ──────────────────────────────────────────────────────────────
load_dotenv()  # pulls secrets from .env
openai.api_key = os.getenv("OPENAI_API_KEY")
# ──────────────────────────────────────────────────────────────

def call_gpt(
    prompt: str,
    system_message: str | None = None,
    *,
    model: str = "gpt-3.5-turbo",
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
    model : str, default ``"gpt-3.5-turbo"``
        Model to use (e.g. ``"gpt-3.5-turbo"``, ``"gpt-4"``, ``"gpt-4o"`` …).
    temperature : float or None
        Sampling temperature. Default is ``None``.

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

        # Construct the parameters for chat completion
        chat_kwargs = {"model": model, "messages": messages}

        # Attach temperature only for models that support it
        if model not in {"o4-mini", "o4"} and temperature is not None:
            chat_kwargs["temperature"] = temperature

        response = openai.ChatCompletion.create(**chat_kwargs)
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Error calling GPT: {e}")
        return None
