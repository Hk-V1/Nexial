from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from models.user import User
from models.chat import Chat
from models.message import Message
from typing import List

def get_or_create_chat(db: Session, user1_id: int, user2_id: int):
    """Get existing chat or create new one between two users"""
    existing_chat = db.query(Chat).filter(
        or_(
            and_(Chat.user1_id == user1_id, Chat.user2_id == user2_id),
            and_(Chat.user1_id == user2_id, Chat.user2_id == user1_id)
        )
    ).first()
    
    if existing_chat:
        return existing_chat
    
    new_chat = Chat(user1_id=user1_id, user2_id=user2_id)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

def get_user_contacts(db: Session, user_id: int):
    """Get all users that the current user has chatted with"""
    # Get all chats where user is involved
    chats = db.query(Chat).filter(
        or_(Chat.user1_id == user_id, Chat.user2_id == user_id)
    ).all()
    
    contact_ids = set()
    for chat in chats:
        if chat.user1_id != user_id:
            contact_ids.add(chat.user1_id)
        if chat.user2_id != user_id:
            contact_ids.add(chat.user2_id)
    
    # Get all other users (for demo purposes - in production, you'd want proper contact management)
    all_users = db.query(User).filter(User.id != user_id).all()
    
    return all_users

def get_chat_messages(db: Session, user_id: int, other_user_id: int):
    """Get messages between two users"""
    chat = get_or_create_chat(db, user_id, other_user_id)
    messages = db.query(Message).filter(Message.chat_id == chat.id)\
                                .order_by(Message.created_at)\
                                .all()
    return messages

def send_message(db: Session, sender_id: int, receiver_id: int, content: str):
    """Send a message between two users"""
    chat = get_or_create_chat(db, sender_id, receiver_id)
    
    message = Message(
        chat_id=chat.id,
        sender_id=sender_id,
        content=content
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
