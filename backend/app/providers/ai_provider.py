import os
import json
import requests
from typing import Dict, Any

AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama")
AI_MODEL = os.getenv("AI_MODEL", "gemma")

def extract_memory_with_ai(text: str) -> Dict[str, Any]:
    """
    Extracts structured memory from text using the configured AI provider.
    """
    prompt = f"""
    Analyze the following memory and extract the entities and details as structured JSON.
    Only return a raw JSON object. Do not wrap in markdown tags like ```json.
    
    Expected JSON structure:
    {{
        "summary": "Brief summary of the memory",
        "people": ["List of people mentioned"],
        "topics": ["List of topics mentioned"],
        "dates": ["List of dates or deadlines mentioned"],
        "actions": ["List of actionable items or tasks"]
    }}
    
    Memory: "{text}"
    """
    
    if AI_PROVIDER == "ollama":
        return _call_ollama(prompt)
    else:
        # Fallback to simple extraction if no real AI provider is configured
        return _mock_extraction(text)

def _call_ollama(prompt: str) -> Dict[str, Any]:
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": AI_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=10
        )
        response.raise_for_status()
        result_text = response.json().get("response", "{}")
        return json.loads(result_text)
    except Exception as e:
        print(f"Ollama API Error: {e}")
        return _mock_extraction(prompt) # fallback if ollama is not running

def _mock_extraction(text: str) -> Dict[str, Any]:
    return {
        "summary": text,
        "people": ["Rahul"] if "Rahul" in text else [],
        "topics": ["Internship"] if "internship" in text.lower() else [],
        "dates": ["Friday"] if "Friday" in text else [],
        "actions": ["Send GitHub"] if "github" in text.lower() else []
    }

def generate_answer_from_memories(question: str, context_memories: list) -> str:
    """
    Generates an answer to the user's question grounded in the retrieved memories.
    """
    if not context_memories:
        return "I don't have a memory that supports that yet."
        
    context_text = "\n\n".join(
        f"- On {mem.created_at.strftime('%B %d')}, you mentioned: {mem.original_input}\n  (Extracted context: People: {', '.join(mem.people or [])}, Topics: {', '.join(mem.topics or [])}, Actions: {', '.join(mem.actions or [])})"
        for mem in context_memories
    )
    
    prompt = f"""
    You are Mitra, a private AI memory companion.
    Answer the user's question using ONLY the provided memory context below.
    If the context does not contain the answer, say exactly "I don't have a memory that supports that yet."
    Be concise, helpful, and speak directly to the user (e.g., "You mentioned that...").
    
    Context Memories:
    {context_text}
    
    Question: {question}
    """
    
    if AI_PROVIDER == "ollama":
        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": AI_MODEL,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=15
            )
            response.raise_for_status()
            return response.json().get("response", "I could not generate an answer.")
        except Exception as e:
            print(f"Ollama API Error during QA: {e}")
            return _mock_answer(question, context_memories)
    else:
        return _mock_answer(question, context_memories)

def _mock_answer(question: str, memories: list) -> str:
    if not memories:
        return "I don't have enough information to answer that confidently."
    return f"Based on your memories, you mentioned '{memories[0].original_input}'. This should help answer your question."

