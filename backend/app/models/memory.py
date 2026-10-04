from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    original_input = Column(Text, nullable=False)
    source_type = Column(String, default="text") # text or voice
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # AI Extracted Fields (stored as JSON)
    summary = Column(Text, nullable=True)
    people = Column(JSON, nullable=True) # list of names
    topics = Column(JSON, nullable=True) # list of topics
    dates = Column(JSON, nullable=True) # list of extracted dates/deadlines
    actions = Column(JSON, nullable=True) # list of tasks/actions
    
    # Used for retrieval reference
    metadata_fields = Column(JSON, nullable=True) 
