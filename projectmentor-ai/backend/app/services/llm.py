import os
import json
from typing import Dict, Any, Optional
from app.config import settings

class LLMService:
    @classmethod
    def generate_completion(cls, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        api_key = settings.LLM_API_KEY
        provider = settings.LLM_PROVIDER.lower()

        if api_key and provider == "openrouter":
            try:
                from openai import OpenAI
                client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=api_key,
                    default_headers={
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "ProjectMentor AI"
                    }
                )
                response = client.chat.completions.create(
                    model=settings.LLM_MODEL or "openai/gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=temperature
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"[LLMService] OpenRouter completion failed ({e}). Returning fallback response.")
                return cls._generate_fallback_response(user_prompt)

        elif api_key and provider == "openai":
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model=settings.LLM_MODEL or "gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=temperature
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"[LLMService] OpenAI completion failed ({e}). Returning fallback response.")
                return cls._generate_fallback_response(user_prompt)

        elif api_key and provider == "gemini":
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(settings.LLM_MODEL or "gemini-1.5-flash")
                full_prompt = f"System: {system_prompt}\n\nUser: {user_prompt}"
                response = model.generate_content(full_prompt)
                return response.text.strip()
            except Exception as e:
                print(f"[LLMService] Gemini completion failed ({e}). Returning fallback response.")
                return cls._generate_fallback_response(user_prompt)

        return cls._generate_fallback_response(user_prompt)

    @staticmethod
    def _generate_fallback_response(user_prompt: str) -> str:
        """
        Grounded response logic when third-party LLM API calls fail or offline.
        Provides synthesis based on the retrieved project context.
        """
        if "CONTEXT:" in user_prompt:
            parts = user_prompt.split("CONTEXT:")
            context_part = parts[1] if len(parts) > 1 else ""
            
            if not context_part.strip() or "No relevant project context found" in context_part:
                return "I couldn't find this information in your project's uploaded knowledge base."
            
            lines = [l.strip() for l in context_part.split("\n") if l.strip() and not l.startswith("--- Document:")]
            extracted_info = "\n".join(lines[:6])
            
            return (
                f"Based on your uploaded project documentation:\n\n"
                f"{extracted_info}\n\n"
                f"*Note: Synthesized directly from retrieved project chunks.*"
            )
        
        return "I could not locate specific details matching your question in the project knowledge base."
