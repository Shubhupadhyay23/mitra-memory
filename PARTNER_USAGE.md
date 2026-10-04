# Partner Integration Usage

This document strictly verifies and outlines the exact usage of Hacktoberfest 2026 partner technologies within the Mitra project.

## Gemma
- **Technology:** Open-weight AI reasoning layer
- **Where used:** The core intelligence layer. Gemma is invoked in the backend (`app/providers/ai_provider.py`) for two critical operations:
  1. Extracting structured entities (People, Topics, Dates, Actions, Summary) from messy user input strings.
  2. Synthesizing retrieved memories to answer user questions contextually without hallucinating.
- **Why it matters:** Allows Mitra to run completely offline/privately on local hardware without depending on closed cloud providers, solving the core privacy concern of a personal memory companion.
- **How to configure:** Set `AI_PROVIDER=ollama` and `AI_MODEL=gemma` in your `.env`. Run Ollama locally.
- **Proof/test:** The "How Mitra understood this" transparency panel visibly displays the latency and provider when a memory is processed. If Gemma is disabled, the system gracefully falls back to mock data.

## Backboard
- **Technology:** Remote memory sync wrapper
- **Where used:** During the `POST /api/memories` save flow (`app/providers/backboard_provider.py`).
- **Why it matters:** Implemented strictly as a fire-and-forget sync wrapper for the Hacktoberfest 2026 integration challenge. It allows memory states to optionally sync to a remote dashboard.
- **How to configure:** Provide `BACKBOARD_API_KEY` in `.env`.
- **Proof/test:** Watch backend stdout logs. If the API key is invalid/missing, the backend logs "Backboard API returned non-200 status. Using local fallback." The local SQLite DB continues operating perfectly.

## ElevenLabs
- **Technology:** Voice Synthesis / TTS
- **Where used:** After a user successfully creates a voice memory, Mitra synthesizes a natural, human-sounding confirmation ("Got it. I've saved that memory.") which plays in the frontend.
- **Why it matters:** Enhances the emotional connection. Hearing a natural voice confirm your thought makes the interaction feel like a companion rather than a database.
- **How to configure:** Provide `ELEVENLABS_API_KEY` in `.env`.
- **Proof/test:** Submit a memory via the microphone. If the key exists, you will hear the `.mp3` confirmation. If missing, the app continues silently without erroring.
