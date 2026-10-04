from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.memory import Memory
from app.providers.ai_provider import extract_memory_with_ai, generate_answer_from_memories
from sqlalchemy import or_
import base64
from app.providers.voice_provider import generate_voice_confirmation
from app.schemas.memory import MemoryCreate, MemoryResponse, MemoryCreateResponse, MemoryExtraction, AskRequest, AskResponse

router = APIRouter(tags=["memories"])

@router.get("/memories", response_model=List[MemoryResponse])
def get_memories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    memories = db.query(Memory).order_by(Memory.created_at.desc()).offset(skip).limit(limit).all()
    # Handle json fields returning None
    for mem in memories:
        if mem.people is None: mem.people = []
        if mem.topics is None: mem.topics = []
        if mem.dates is None: mem.dates = []
        if mem.actions is None: mem.actions = []
    return memories

@router.post("/extract")
def extract_info(memory: MemoryCreate):
    import time
    start_time = time.time()
    
    # Call AI Provider to extract structured info
    extraction = extract_memory_with_ai(memory.original_input)
    
    latency = round(time.time() - start_time, 2)
    
    audio_base64 = None
    if memory.source_type == "voice":
        audio_bytes = generate_voice_confirmation("Got it. I've saved that memory.")
        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
    return {
        "extraction": extraction,
        "audio_base64": audio_base64,
        "original_input": memory.original_input,
        "source_type": memory.source_type,
        "metadata": {
            "model": "Gemma (via Ollama)",
            "provider": "Local Ollama",
            "latency": f"{latency}s"
        }
    }

@router.post("/memories", response_model=MemoryCreateResponse)
def create_memory(memory: MemoryCreate, db: Session = Depends(get_db)):
    # 1. Use pre-extracted info or call AI Provider
    if memory.summary:
        extraction = {
            "summary": memory.summary,
            "people": memory.people or [],
            "topics": memory.topics or [],
            "dates": memory.dates or [],
            "actions": memory.actions or []
        }
    else:
        extraction = extract_memory_with_ai(memory.original_input)
    
    db_memory = Memory(
        original_input=memory.original_input,
        source_type=memory.source_type,
        summary=extraction.get("summary", memory.original_input),
        people=extraction.get("people", []),
        topics=extraction.get("topics", []),
        dates=extraction.get("dates", []),
        actions=extraction.get("actions", []),
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    
    if db_memory.people is None: db_memory.people = []
    if db_memory.topics is None: db_memory.topics = []
    if db_memory.dates is None: db_memory.dates = []
    if db_memory.actions is None: db_memory.actions = []
    
    # Phase 5: Sync to Backboard
    from app.providers.backboard_provider import sync_memory_to_backboard
    sync_memory_to_backboard(db_memory)
    
    audio_base64 = None
    if memory.source_type == "voice":
        audio_bytes = generate_voice_confirmation("Got it. I've saved that memory.")
        if audio_bytes:
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
    
    return MemoryCreateResponse(
        memory=db_memory,
        audio_base64=audio_base64
    )

@router.get("/memories/{memory_id}", response_model=MemoryResponse)
def get_memory(memory_id: int, db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
        
    if memory.people is None: memory.people = []
    if memory.topics is None: memory.topics = []
    if memory.dates is None: memory.dates = []
    if memory.actions is None: memory.actions = []
    return memory

@router.delete("/memories/{memory_id}")
def delete_memory(memory_id: int, db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    db.delete(memory)
    db.commit()
    return {"status": "success", "message": "Memory deleted"}

@router.post("/ask", response_model=AskResponse)
def ask_question(request: AskRequest, db: Session = Depends(get_db)):
    # Very basic keyword extraction for mock semantic search
    keywords = [word for word in request.question.lower().split() if len(word) > 3]
    
    query = db.query(Memory)
    if keywords:
        filters = []
        for kw in keywords:
            filters.append(Memory.original_input.ilike(f"%{kw}%"))
            # In a real app we'd also search json fields or use pgvector/backboard
        query = query.filter(or_(*filters))
    
    relevant_memories = query.order_by(Memory.created_at.desc()).limit(5).all()
    
    # Handle None in json fields for response
    for mem in relevant_memories:
        if mem.people is None: mem.people = []
        if mem.topics is None: mem.topics = []
        if mem.dates is None: mem.dates = []
        if mem.actions is None: mem.actions = []

    answer = generate_answer_from_memories(request.question, relevant_memories)

    return AskResponse(
        answer=answer,
        sources=relevant_memories
    )
