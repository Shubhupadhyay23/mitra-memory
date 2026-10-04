# MITRA
**Remember what matters.**

## The Problem
I built Mitra because someone I care about kept losing important thoughts inside scattered voice notes and messy chats. Humans forget details, deadlines, and promises. Generic note-taking apps feel like filing cabinets—you have to organize them yourself. 

Mitra is different. It acts as a private memory companion. The killer moment happens when you ask, "What did Rahul say about the internship?", and Mitra confidently responds: **"You told me this before,"** retrieving the exact date, context, and original memory.

## Live Demo & Video
### Demo
[PLACEHOLDER FOR FINAL DEPLOYED URL]

*(Note: The public demo uses "Demo Mode" with pre-configured deterministic data for judges to instantly test the UI without needing local AI setup.)*

### Video Demo
[PLACEHOLDER]

## Two Modes of Operation
Mitra is built to respect data ownership, running best on your local machine.

### 1. Local Full Mode
The intended, privacy-first experience.
- **AI Reasoning:** Local Ollama running the open-weight **Gemma** model.
- **Storage:** Local **SQLite** database (`mitra.db`).
- **Functionality:** Real-time extraction of entities from raw input, and true hallucination-free retrieval grounded in your persistent local storage.

### 2. Public Demo Mode
Designed specifically for Hacktoberfest judges.
- **Why?** Since cloud deployments typically use ephemeral filesystems (where SQLite resets) and cannot securely tunnel to your laptop's local Ollama instance, the public link operates in Demo Mode. 
- **Functionality:** Features a "Try the 60-second Demo" button that loads deterministic fictional data to demonstrate the UI, the extraction flow, and the "You told me this before" grounding logic without breaking.

## Why Open-Source AI?
Mitra is designed around open-weight AI so the reasoning layer can be run completely locally on your hardware. This gives us model choice, self-hosting potential, and ensures your private, sensitive memories don't have to be sent to a closed cloud provider.

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
Persistent storage (SQLite Local)
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
Please add the following images to the `docs/screenshots` directory:

1. **Tell Mitra**
   ![Tell Mitra](docs/screenshots/1-tell-mitra.png)
2. **Gemma understanding**
   ![Gemma understanding](docs/screenshots/2-gemma-understanding.png)
3. **"You told me this before"**
   ![You told me this before](docs/screenshots/3-you-told-me-this-before.png)
4. **Memory Graph**
   ![Memory Graph](docs/screenshots/4-memory-graph.png)

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
```

## Limitations
- **AI Inference:** Full live AI processing requires Ollama running locally. 
- **Storage:** SQLite is intended for local/self-hosted use. If deployed to a cloud provider with an ephemeral file system (like Render's free tier), memories will clear upon reboot unless a persistent disk or external Postgres DB is configured.
- **Public Demo:** The public Vercel/Render link uses Demo Mode by default if a remote Gemma endpoint is not configured.

## Partner Integrations
See [`PARTNER_USAGE.md`](PARTNER_USAGE.md) for strict technical verification of how Gemma and ElevenLabs are actually used in this codebase.

## License
MIT
