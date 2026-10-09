from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    TriageRecommendation,
    AnalystDecisionRequest,
    IncidentStatus,
    AuditRecord,
    ChatRequest,
    ChatResponse
)
from app.services.alert_simulator import alert_service
from app.services.rag_engine import rag_engine
from app.services.audit_service import audit_service

router = APIRouter(prefix="/triage", tags=["RAG Triage & Human Decision"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    alert = None
    if request.alert_id:
        alert = alert_service.get_by_id(request.alert_id)
    return await rag_engine.answer_chat(request, alert)

@router.post("/decision", response_model=AuditRecord)
async def submit_analyst_decision(request: AnalystDecisionRequest):
    alert = alert_service.get_by_id(request.alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Determine status
    if request.decision.value == "APPROVE":
        alert.status = IncidentStatus.APPROVED
    elif request.decision.value == "REJECT":
        alert.status = IncidentStatus.REJECTED
    elif request.decision.value == "OVERRIDE":
        alert.status = IncidentStatus.OVERRIDDEN

    alert_service.update_alert(alert)

    # Extract SOP references from triage result
    sop_refs = []
    summary = alert.description
    if alert.triage_result:
        summary = alert.triage_result.get("incident_summary", alert.description)
        citations = alert.triage_result.get("sop_citations", [])
        sop_refs = [f"{c.get('sop_id')} ({c.get('section')})" for c in citations]
        if not sop_refs:
            actions = alert.triage_result.get("recommended_actions", [])
            sop_refs = [a.get("sop_reference") for a in actions if a.get("sop_reference")]

    # Log to cryptographic audit chain
    record = audit_service.log_decision(
        alert_id=alert.id,
        analyst_id=request.analyst_id,
        decision=request.decision.value,
        incident_summary=summary,
        sop_references=sop_refs,
        notes=request.notes or ""
    )

    return record

@router.post("/{alert_id}", response_model=TriageRecommendation)
async def triage_incident(alert_id: str):
    alert = alert_service.get_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Run RAG engine
    recommendation = await rag_engine.triage_alert(alert)

    # Update alert state
    alert.status = IncidentStatus.TRIAGED
    alert.triage_result = recommendation.model_dump()
    alert_service.update_alert(alert)

    return recommendation
