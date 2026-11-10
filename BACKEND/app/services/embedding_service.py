
from google import genai
from google.genai import types

from app.core.config import settings

client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)


def generate_embedding(text: str) -> list[float]:
    """Generate a normalized 768-dimensional text embedding."""

    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    response = client.models.embed_content(
        model=settings.GEMINI_EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=768,
            task_type="RETRIEVAL_DOCUMENT"
        )
    )

    if not response.embeddings:
        raise RuntimeError("Gemini returned no embeddings")

    vector = response.embeddings[0].values

    if len(vector) != 768:
        raise ValueError(
            f"Expected 768 dimensions, received {len(vector)}"
        )

    # Normalize reduced-dimensional embeddings
    norm = sum(value * value for value in vector) ** 0.5

    if norm == 0:
        raise ValueError("Received a zero-length embedding")

    return [value / norm for value in vector]


def generate_query_embedding(text: str) -> list[float]:
    """Generate a normalized embedding for a search query."""

    if not text or not text.strip():
        raise ValueError("Search query cannot be empty")

    response = client.models.embed_content(
        model=settings.GEMINI_EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=768,
            task_type="RETRIEVAL_QUERY"
        )
    )

    if not response.embeddings:
        raise RuntimeError("Gemini returned no query embedding")

    vector = response.embeddings[0].values

    if len(vector) != 768:
        raise ValueError("Expected 768-dimensional query embedding")

    norm = sum(value * value for value in vector) ** 0.5

    if norm == 0:
        raise ValueError("Received a zero-length query embedding")

    return [value / norm for value in vector]
