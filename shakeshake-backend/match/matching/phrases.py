"""
Catch-phrase generation using LangChain + Ollama.
Generates short, catchy one-liners when two people match on ShakeShake.
"""

import os
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_MODEL = os.environ.get("OLLAMA_CHAT_MODEL", "gpt-oss:120b-cloud")

# Fallback phrases used when Ollama is unavailable
FALLBACK_PHRASES = [
    "Vibes aligned ✨",
    "Your people just found you 🔥",
    "Stars crossed paths 🌟",
    "Right place, right vibe 💫",
    "Energy match detected ⚡",
    "The universe said yes 💥",
    "Frequency matched 📡",
    "Fate just shook your hand 🤝",
    "Cosmic click 🌙",
    "Perfect wavelength 🌊",
]

_fallback_index = 0


def _get_fallback() -> str:
    """Cycle through fallback phrases."""
    global _fallback_index
    phrase = FALLBACK_PHRASES[_fallback_index % len(FALLBACK_PHRASES)]
    _fallback_index += 1
    return phrase


def generate_catch_phrase(
    user_a_data: dict,
    user_b_data: dict,
    percentage: float,
) -> str:
    """
    Generate a catchy match phrase using Ollama via LangChain.
    Falls back to template phrases if Ollama is unavailable.
    """
    try:
        from langchain_ollama import ChatOllama
        from langchain_core.prompts import ChatPromptTemplate

        llm = ChatOllama(
            model=OLLAMA_CHAT_MODEL,
            base_url=OLLAMA_BASE_URL,
            temperature=0.9,
            num_predict=60,
            timeout=5,
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You generate short, catchy, creative one-liner phrases when two people match on a social app called ShakeShake. "
             "The phrase should reference their shared vibe, activity, or mood in a fun, Gen-Z friendly way. "
             "Be specific — never generic like 'Great match!' or 'You two will get along!'. "
             "Return ONLY the phrase, no quotes, no extra text. Max 60 characters."),
            ("human",
             "User A: mood={mood_a}, goal={goal_a}, activities={activities_a}, vibe={vibe_a}, own words: '{own_words_a}'\n"
             "User B: mood={mood_b}, goal={goal_b}, activities={activities_b}, vibe={vibe_b}, own words: '{own_words_b}'\n"
             "Match: {percentage}%\n"
             "Generate a catchy match phrase:"),
        ])

        chain = prompt | llm
        result = chain.invoke({
            "mood_a": user_a_data.get("mood", ""),
            "goal_a": user_a_data.get("goal", ""),
            "activities_a": ", ".join(user_a_data.get("activities", [])),
            "vibe_a": user_a_data.get("vibeType", ""),
            "own_words_a": user_a_data.get("ownWords", ""),
            "mood_b": user_b_data.get("mood", ""),
            "goal_b": user_b_data.get("goal", ""),
            "activities_b": ", ".join(user_b_data.get("activities", [])),
            "vibe_b": user_b_data.get("vibeType", ""),
            "own_words_b": user_b_data.get("ownWords", ""),
            "percentage": round(percentage),
        })

        phrase = result.content.strip()
        if phrase and len(phrase) <= 80:
            return phrase

    except Exception as e:
        logger.warning(f"Ollama phrase generation failed: {e}")

    return _get_fallback()


def compute_semantic_score(own_words_a: str | None, own_words_b: str | None) -> float:
    """
    Compute semantic similarity between two users' 'own words' descriptions
    using Ollama embeddings. Returns 0–1. Falls back to 0.5 if unavailable.
    """
    if not own_words_a or not own_words_b:
        return 0.5

    try:
        from langchain_ollama import OllamaEmbeddings
        import numpy as np

        embeddings = OllamaEmbeddings(
            model="nomic-embed-text",
            base_url=OLLAMA_BASE_URL,
        )

        emb_a = embeddings.embed_query(own_words_a)
        emb_b = embeddings.embed_query(own_words_b)

        a = np.array(emb_a)
        b = np.array(emb_b)
        similarity = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

        # Cosine similarity ranges -1 to 1; normalize to 0-1
        return max(0.0, min(1.0, (similarity + 1) / 2))

    except Exception as e:
        logger.warning(f"Ollama embeddings failed: {e}")
        return 0.5
