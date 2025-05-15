# backend/app/core/openai_client.py
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env
load_dotenv()

# Instantiate the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def call_gpt(
    prompt: str,
    system_message: str | None = None,
    *,
    model: str = "gpt-3.5-turbo",
    temperature: float | None = None,
    max_completion_tokens: int | None = None,
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
        messages: list[dict[str, str]] = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        # Construct the parameters for chat completion
        chat_kwargs: dict = {"model": model, "messages": messages}

        # Attach temperature only for models that support it
        if model not in {"o4-mini", "o4"} and temperature is not None:
            chat_kwargs["temperature"] = temperature
        
        # Allow user to cap the output
        if max_completion_tokens is not None:
            chat_kwargs["max_completion_tokens"] = max_completion_tokens

        # Use the new 1.x client interface
        response = client.chat.completions.create(**chat_kwargs)
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Error calling GPT: {e}")
        return None
