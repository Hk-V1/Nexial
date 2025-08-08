from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from .user import User

class ChatBase(BaseModel):
    pass

class ChatCreate(BaseModel):
    user2_id: int

class Chat(ChatBase):
    id: int
    user1_id: int
    user2_id: int
    created_at: datetime
    user1: User
    user2: User
    
    class Config:
        from_attributes = True
