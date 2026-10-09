from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ConfidenceLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class IncidentStatus(str, Enum):
    NEW = "NEW"
    TRIAGED = "TRIAGED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    OVERRIDDEN = "OVERRIDDEN"

class ThreatType(str, Enum):
    PHISHING = "phishing"
    RANSOMWARE = "ransomware"
    BRUTE_FORCE = "brute_force"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    MALWARE = "malware"
    DATA_EXFILTRATION = "data_exfiltration"

# --- Alert Models ---
class AlertCreate(BaseModel):
    title: str
    threat_type: ThreatType
    severity: SeverityLevel
    source_ip: str
    target_host: str
    target_user: Optional[str] = "root"
    indicators: List[str] = Field(default_factory=list)
    raw_log: str
    description: str

class Alert(AlertCreate):
    id: str
    timestamp: str
    status: IncidentStatus = IncidentStatus.NEW
    triage_result: Optional[Dict[str, Any]] = None

# --- SOP Models ---
class SOPChunk(BaseModel):
    chunk_id: str
    sop_id: str
    title: str
    section: str
    content: str
    keywords: List[str] = Field(default_factory=list)
    embedding: Optional[List[float]] = None

class SOPDocument(BaseModel):
    id: str
    title: str
    filename: str
    threat_category: str
    uploaded_at: str
    chunks_count: int
    content_summary: str

# --- RAG Recommendation Models ---
class RecommendedAction(BaseModel):
    step: int
    phase: str # e.g. Triage, Containment, Eradication, Recovery
    action: str
    sop_reference: str # e.g. "SOP-SEC-01 §3.2"

class SOPCitation(BaseModel):
    sop_id: str
    sop_title: str
    section: str
    excerpt: str
    similarity_score: float

class ConfidenceAssessment(BaseModel):
    level: ConfidenceLevel
    score: float # 0.0 to 1.0
    rationale: str

class TriageRecommendation(BaseModel):
    alert_id: str
    incident_summary: str
    assessed_severity: SeverityLevel
    confidence: ConfidenceAssessment
    recommended_actions: List[RecommendedAction]
    sop_citations: List[SOPCitation]
    analyst_guidance: str

# --- Human In The Loop Action ---
class DecisionType(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    OVERRIDE = "OVERRIDE"

class AnalystDecisionRequest(BaseModel):
    alert_id: str
    decision: DecisionType
    analyst_id: str = "analyst_1"
    notes: Optional[str] = ""
    custom_actions: Optional[List[str]] = None

# --- Chat & Conversational Assistant Models ---
class ChatMessage(BaseModel):
    role: str # "user" | "assistant" | "system"
    content: str
    timestamp: Optional[str] = None
    confidence: Optional[ConfidenceAssessment] = None
    sop_citations: Optional[List[SOPCitation]] = None
    actions: Optional[List[RecommendedAction]] = None
    alert_id: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    alert_id: Optional[str] = None
    history: List[ChatMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    message: str
    confidence: ConfidenceAssessment
    sop_citations: List[SOPCitation]
    actions: List[RecommendedAction]
    suggested_followups: List[str]

# --- Audit Logging & Hash Chaining ---
class AuditRecord(BaseModel):
    audit_id: str
    sequence_number: int
    prev_hash: str
    current_hash: str
    timestamp: str
    alert_id: str
    analyst_id: str
    decision: str
    incident_summary: str
    sop_references: List[str]
    notes: str
    is_tamper_verified: Optional[bool] = True

class AuditVerificationResponse(BaseModel):
    is_valid: bool
    total_records: int
    broken_links: List[int] = Field(default_factory=list)
    message: str

# --- Auth Models ---
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
