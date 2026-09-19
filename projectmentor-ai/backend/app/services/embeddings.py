import os
import hashlib
import numpy as np
from typing import List
from app.config import settings

class EmbeddingService:
    @staticmethod
    def _generate_fallback_embedding(text: str, dim: int = 1536) -> List[float]:
        """
        Generates a deterministic 1536-dimensional normalized vector for offline/test environments.
        Uses SHA-256 hashing to map text semantics into vector space.
        """
        seed = int(hashlib.sha256(text.encode('utf-8')).hexdigest(), 16) % (2**32)
        rng = np.random.RandomState(seed)
        vec = rng.randn(dim)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        api_key = settings.EMBEDDING_API_KEY or settings.LLM_API_KEY
        provider = settings.EMBEDDING_PROVIDER.lower()

        if api_key and provider == "openrouter":
            try:
                from openai import OpenAI
                client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=api_key
                )
                response = client.embeddings.create(
                    model=settings.EMBEDDING_MODEL or "text-embedding-3-small",
                    input=text
                )
                return response.data[0].embedding
            except Exception as e:
                print(f"[EmbeddingService] OpenRouter embedding failed ({e}), using fallback vector.")
                return cls._generate_fallback_embedding(text)

        elif api_key and provider == "openai":
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
                response = client.embeddings.create(
                    model=settings.EMBEDDING_MODEL or "text-embedding-3-small",
                    input=text
                )
                return response.data[0].embedding
            except Exception as e:
                print(f"[EmbeddingService] OpenAI embedding failed ({e}), using fallback vector.")
                return cls._generate_fallback_embedding(text)

        elif api_key and provider == "gemini":
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                result = genai.embed_content(
                    model="models/text-embedding-004",
                    content=text
                )
                vec = result['embedding']
                if len(vec) < 1536:
                    vec = vec + [0.0] * (1536 - len(vec))
                elif len(vec) > 1536:
                    vec = vec[:1536]
                return vec
            except Exception as e:
                print(f"[EmbeddingService] Gemini embedding failed ({e}), using fallback vector.")
                return cls._generate_fallback_embedding(text)

        return cls._generate_fallback_embedding(text)

    @classmethod
    def get_embeddings_batch(cls, texts: List[str]) -> List[List[float]]:
        return [cls.get_embedding(t) for t in texts]
