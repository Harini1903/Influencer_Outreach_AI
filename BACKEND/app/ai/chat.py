import asyncio
from collections.abc import AsyncIterator, Callable

from app.ai.models import models


class Chat:
    """
    Unified chat interface.

    Provider order:

        Groq
          ↓
        Retry after 2 seconds
          ↓
        Retry after 4 seconds
          ↓
        Retry after 6 seconds
          ↓
        Gemini
          ↓
        Retry after 2 seconds
          ↓
        Retry after 4 seconds
          ↓
        Retry after 6 seconds
    """

    RETRY_DELAYS = [2, 4, 6]

    async def _stream_with_retry(
        self,
        provider_name: str,
        provider: Callable[..., AsyncIterator[str]],
        prompt: str
    ) -> AsyncIterator[str]:

        last_error = None

        for attempt, delay in enumerate(self.RETRY_DELAYS):

            try:
                print(
                    f"[LLM] {provider_name} "
                    f"attempt {attempt + 1}/{len(self.RETRY_DELAYS)}"
                )

                async for chunk in provider(prompt):
                    yield chunk

                return

            except Exception as error:

                last_error = error

                print(
                    f"[LLM] {provider_name} failed: {error}"
                )

                if attempt < len(self.RETRY_DELAYS) - 1:

                    print(
                        f"[LLM] Retrying {provider_name} "
                        f"in {delay} seconds..."
                    )

                    await asyncio.sleep(delay)

        raise RuntimeError(
            f"{provider_name} failed after "
            f"{len(self.RETRY_DELAYS)} attempts"
        ) from last_error

    async def stream(
        self,
        prompt: str
    ) -> AsyncIterator[str]:

        fallback_chain = models.get_fallback_chain()

        for provider_name, provider in fallback_chain:

            print(
                f"[LLM] Trying provider: {provider_name}"
            )

            try:

                async for chunk in self._stream_with_retry(
                    provider_name=provider_name,
                    provider=provider,
                    prompt=prompt
                ):
                    yield chunk

                print(
                    f"[LLM] Completed using {provider_name}"
                )

                return

            except Exception as error:

                print(
                    f"[LLM] {provider_name} unavailable: {error}"
                )

                print(
                    "[LLM] Falling back to next provider..."
                )

        raise RuntimeError(
            "All LLM providers failed."
        )


chat = Chat()