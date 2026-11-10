from dotenv import load_dotenv
import os

load_dotenv()


class Settings:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_LLM_MODEL = os.getenv("GROQ_LLM_MODEL")

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_LLM_MODEL = os.getenv("GEMINI_LLM_MODEL")
    GEMINI_EMBEDDING_MODEL =os.getenv("GEMINI_EMBEDDING_MODEL")

    DATABASE_URL = os.getenv("DATABASE_URL")
    YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


settings = Settings()