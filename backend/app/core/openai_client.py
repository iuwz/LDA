# app/core/openai_client.py
import os
import openai
from dotenv import load_dotenv

load_dotenv()  # loads variables from .env
openai.api_key = os.getenv("OPENAI_API_KEY")

def call_gpt(prompt, system_message=None, temperature=0.7):
    """
    Calls GPT (model='gpt-4o-mini') or whichever model you’d like (e.g. 'gpt-3.5-turbo'),
    then returns the response text.
    """
    try:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",        # or "gpt-3.5-turbo" if you prefer
            messages=messages,
            temperature=temperature
        )
        return response.choices[0].message["content"].strip()
    except Exception as e:
        print(f"Error calling GPT: {e}")
        return None
