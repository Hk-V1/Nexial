from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.message import MessageCreate, Message
from schemas.user import User as UserSchema
from services.auth_service import get_current_user
from services.chat_service import (
    get_user_contacts,
    get_chat_messages,
    send_message
)

router = APIRouter()
security = HTTPBearer()

def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get authenticated user"""
    user = get_current_user(db, credentials.credentials)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.get("/contacts", response_model=List[UserSchema])
def get_contacts(
    user = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """Get user's contacts"""
    contacts = get_user_contacts(db, user.id)
    return contacts

@router.get("/messages/{other_user_id}", response_model=List[Message])
def get_messages(
    other_user_id: int,
    user = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """Get messages between current user and another user"""
    messages = get_chat_messages(db, user.id, other_user_id)
    return messages

@router.post("/send", response_model=Message)
def send_chat_message(
    message_data: MessageCreate,
    user = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """Send a message to another user"""
    message = send_message(
        db, 
        user.id, 
        message_data.receiver_id, 
        message_data.content
    )
    return message
