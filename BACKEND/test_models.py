import asyncio

from app.ai.models import models


async def main():
    print("Testing Groq...")

    response = []

    async for chunk in models.stream_groq(
        "Say hello and confirm that Groq is working."
    ):
        print(chunk, end="", flush=True)
        response.append(chunk)

    print("\n")
    print("Groq test completed.")


if __name__ == "__main__":
    asyncio.run(main())