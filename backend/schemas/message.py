from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .user import User

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    receiver_id: int

class Message(MessageBase):
    id: int
    chat_id: int
    sender_id: int
    created_at: datetime
    sender: User
    
    class Config:
        from_attributes = True

class AIMessageRequest(BaseModel):
    message: str

class AIMessageResponse(BaseModel):
    response: str
