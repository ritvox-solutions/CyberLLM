from fastapi import APIRouter
from typing import List
from app.models.schemas import AuditRecord, AuditVerificationResponse
from app.services.audit_service import audit_service

router = APIRouter(prefix="/audit", tags=["Cryptographic Audit Ledger"])

@router.get("", response_model=List[AuditRecord])
async def get_audit_trail():
    return audit_service.get_records()

@router.get("/verify", response_model=AuditVerificationResponse)
async def verify_chain_integrity():
    return audit_service.verify_integrity()
