# MITRA
**Remember what matters.**

Mitra is a private AI memory companion that turns messy voice notes and texts into useful, searchable memories.

## The Problem
**Built for a real friend.**
I built Mitra because someone I care about kept losing important thoughts inside scattered voice notes and messy chats. This isn't just a tech demo—it's a tool to solve their real problem of losing context.

## How it works
You speak or type into Mitra. It uses an AI reasoning layer to extract structured information (who you talked to, what you talked about, what you need to do, and when). When you later ask a question, Mitra retrieves those stored memories and gives you an exact, grounded answer with citations. 

## Why Gemma?
Mitra is designed around open-weight AI so the reasoning layer can be run completely locally on your hardware. This gives us model choice, self-hosting potential, and ensures your private memories don't have to be sent to a closed cloud provider.

## Architecture
```text
Human input
     ↓ (Raw text/voice)
Mitra Frontend
     ↓ (API /extract)
Gemma (Ollama)
     ↓ (JSON Extraction)
Structured memory
     ↓ (Save)
Persistent storage (SQLite)
     ↓ (Ask Mitra)
Retrieval (Search)
     ↓ (Context)
Gemma grounded response
     ↓ (Display)
Source memories
```
- **Human input**: Capture raw thoughts naturally.
- **Mitra**: Orchestrates the workflow.
- **Gemma**: Extracts entities and synthesizes answers.
- **Structured memory**: The cleanly parsed JSON.
- **Persistent storage**: Your local SQLite database.
- **Retrieval**: Finding relevant past memories.
- **Gemma response**: Answering questions based *only* on retrieved context.
- **Source memories**: Visible citations preventing hallucination.

## Screenshots
*(Add screenshots here)*
1. Tell Mitra
2. Gemma understanding
3. Saved memory
4. Ask Mitra ("You told me this before")

## Setup
```bash
# 1. Setup Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. Setup Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables
Copy `.env.example` to `.env`:
```
# AI Provider
AI_PROVIDER=ollama
AI_MODEL=gemma

# Optional Hacktoberfest Partners
ELEVENLABS_API_KEY=your_key
BACKBOARD_API_KEY=your_key
```

## Partner Integrations
See [`PARTNER_USAGE.md`](PARTNER_USAGE.md) for strict technical verification of how Gemma, ElevenLabs, and Backboard are actually used in this codebase.

## Privacy & Trust
**YOUR MEMORIES. YOUR MODEL.**
Mitra uses local SQLite storage. Text parsing and memory extraction happen locally via Ollama. It will explicitly refuse to answer questions if it lacks a supporting memory, completely mitigating hallucination.

## License
MIT
