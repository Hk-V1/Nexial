from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from schemas.message import AIMessageRequest, AIMessageResponse
from services.auth_service import get_current_user
from services.ai_service import query_qwen2

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

@router.post("/assistant", response_model=AIMessageResponse)
def chat_with_assistant(
    request: AIMessageRequest,
    user = Depends(get_authenticated_user)
):
    """Chat with AI Assistant powered by Qwen2"""
    try:
        response = query_qwen2(request.message)
        return AIMessageResponse(response=response)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI Assistant is temporarily unavailable"
        )
