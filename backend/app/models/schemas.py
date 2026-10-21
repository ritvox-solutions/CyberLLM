from datetime import datetime
from enum import Enum as PyEnum
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Role(str, PyEnum):
    ANALYST = "analyst"
    ADMIN = "admin"


# --- Auth ----------------------------------------------------------------

class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    username: str
    role: Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    role: Role


# --- Chat ----------------------------------------------------------------

class ChatMessageIn(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatMessageOut(ChatMessageIn):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    created_at: datetime


class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class ChatSessionListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    updated_at: datetime
    archived: bool = False


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # if omitted, a new session is created


class ChatResponse(BaseModel):
    session_id: str = ""
    message: str  # assistant reply
    sources: List[dict] = []  # SOP citations


# --- Tickets -------------------------------------------------------------

class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    threat_type: str
    severity: str
    status: Optional[str]
    source_ip: Optional[str]
    target_host: Optional[str]
    description: str
    created_at: datetime


class TicketStatusUpdate(BaseModel):
    status: Optional[Literal["in_progress", "resolved"]]


# --- SOPs ----------------------------------------------------------------

class SOPDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    filename: str
    category: str
    chunks_count: int


class SOPChunkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sop_id: str
    section: str
    content: str
