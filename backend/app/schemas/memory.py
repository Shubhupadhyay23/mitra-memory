from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class MemoryBase(BaseModel):
    original_input: str
    source_type: Optional[str] = "text"
    
class MemoryCreate(MemoryBase):
    summary: Optional[str] = None
    people: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    dates: Optional[List[str]] = None
    actions: Optional[List[str]] = None

# Output schema for AI Extraction
class MemoryExtraction(BaseModel):
    summary: Optional[str] = None
    people: List[str] = []
    topics: List[str] = []
    dates: List[str] = []
    actions: List[str] = []

class MemoryResponse(MemoryBase):
    id: int
    created_at: datetime
    summary: Optional[str] = None
    people: List[str] = []
    topics: List[str] = []
    dates: List[str] = []
    actions: List[str] = []
    metadata_fields: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class MemoryCreateResponse(BaseModel):
    memory: MemoryResponse
    audio_base64: Optional[str] = None

class AskRequest(BaseModel):
    question: str
    
class AskResponse(BaseModel):
    answer: str
    sources: List[MemoryResponse] = []
