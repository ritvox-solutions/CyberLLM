from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import Alert, AlertCreate
from app.services.alert_simulator import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts & Simulation"])

@router.get("", response_model=List[Alert])
async def get_alerts(status: Optional[str] = Query(None)):
    return alert_service.get_all(status)

@router.get("/{alert_id}", response_model=Alert)
async def get_alert(alert_id: str):
    alert = alert_service.get_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("", response_model=Alert)
async def create_custom_alert(alert_in: AlertCreate):
    return alert_service.create_alert(alert_in)

@router.post("/simulate/{scenario_type}", response_model=Alert)
async def simulate_threat(scenario_type: str):
    valid_types = ["phishing", "ransomware", "brute_force", "unauthorized_access"]
    if scenario_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario. Choose from {valid_types}"
        )
    return alert_service.generate_simulation_scenario(scenario_type)
