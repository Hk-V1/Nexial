from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import socketio
import uvicorn
import os
from dotenv import load_dotenv

from database import engine, get_db
from models import user, chat, message
from api import auth, chat as chat_api, assistant
from services.auth_service import verify_token

load_dotenv()

# Create tables
user.Base.metadata.create_all(bind=engine)
chat.Base.metadata.create_all(bind=engine)
message.Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(title="Nexial B2B Chat Platform", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO setup
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
)

socket_app = socketio.ASGIApp(sio, app)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(chat_api.router, prefix="/chat", tags=["Chat"])
app.include_router(assistant.router, prefix="/chat", tags=["AI Assistant"])

# Socket.IO events
@sio.event
async def connect(sid, environ, auth_data):
    """Handle client connection"""
    try:
        token = auth_data.get('token') if auth_data else None
        if not token:
            await sio.disconnect(sid)
            return False
        
        user_data = verify_token(token)
        if not user_data:
            await sio.disconnect(sid)
            return False
        
        # Store user info in session
        await sio.save_session(sid, {'user_id': user_data['user_id']})
        print(f"User {user_data['user_id']} connected with session {sid}")
        
    except Exception as e:
        print(f"Connection error: {e}")
        await sio.disconnect(sid)
        return False

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    print(f"User {user_id} disconnected")

@sio.event
async def send_message(sid, data):
    """Handle message sending via Socket.IO"""
    try:
        session = await sio.get_session(sid)
        sender_id = session.get('user_id')
        
        if not sender_id:
            return
        
        # Emit message to receiver
        receiver_id = data.get('receiver_id')
        message_data = {
            'id': data.get('id'),
            'content': data.get('content'),
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'timestamp': data.get('timestamp')
        }
        
        # Broadcast to all connected clients (in a real app, you'd target specific users)
        await sio.emit('new_message', message_data)
        
    except Exception as e:
        print(f"Message sending error: {e}")

@app.get("/")
async def root():
    return {"message": "Nexial B2B Chat Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)
