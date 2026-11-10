from collections.abc import AsyncIterator

from google import genai
from groq import AsyncGroq

from app.core.config import settings
from app.ai.prompts.gemini_prompt import SYSTEM_PROMPT


class Models:
    """
    Unified LLM provider manager.

    Primary provider:
        Groq

    Fallback provider:
        Gemini
    """

    def __init__(self):
        self.groq_client = AsyncGroq(
            api_key=settings.GROQ_API_KEY
        )

        self.gemini_client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    async def stream_groq(
        self,
        prompt: str,
        model_name: str | None = None
    ) -> AsyncIterator[str]:

        model_name = model_name or settings.GROQ_LLM_MODEL

        response = await self.groq_client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            stream=True
        )

        async for chunk in response:
            content = chunk.choices[0].delta.content

            if content:
                yield content

    async def stream_gemini(
        self,
        prompt: str,
        model_name: str | None = None
    ) -> AsyncIterator[str]:

        model_name = model_name or settings.GEMINI_LLM_MODEL

        response = await self.gemini_client.aio.models.generate_content_stream(
            model=model_name,
            contents=prompt,
            config={
                "system_instruction": SYSTEM_PROMPT
            }
        )

        async for chunk in response:
            if chunk.text:
                yield chunk.text

    def get_fallback_chain(self):
        """
        Provider priority:

        1. Groq
        2. Gemini
        """

        return [
            ("Groq", self.stream_groq),
            ("Gemini", self.stream_gemini),
        ]


models = Models()