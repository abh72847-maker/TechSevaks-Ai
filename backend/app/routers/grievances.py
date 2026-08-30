from fastapi import APIRouter, HTTPException

from app.database import store
from app.schemas import GrievanceCreateRequest

router = APIRouter(tags=["grievances"])


@router.get("/grievances")
def list_grievances():
    return {"source": "simulated", "note": "Grievance registry.", "grievances": store.get("grievances")}


@router.post("/grievances")
def create_grievance(payload: GrievanceCreateRequest):
    g = store.insert("grievances", {
        "order_id": payload.order_id, "lot_id": payload.lot_id, "category": payload.category,
        "description": payload.description, "status": payload.status, "raised_by": payload.raised_by,
    })
    if payload.order_id:
        store.update("orders", payload.order_id, {"status": "grievance"})
    return {"source": "simulated", "note": "Grievance logged with audit trail.", "grievance": g}


@router.post("/grievances/{grievance_id}/resolve")
def resolve_grievance(grievance_id: str, resolution: str = "Resolved in favour of aggrieved party."):
    g = store.find("grievances", grievance_id)
    if not g:
        raise HTTPException(404, "Grievance not found")
    store.update("grievances", grievance_id, {"status": "resolved", "resolution": resolution})
    if g.get("order_id"):
        store.update("orders", g["order_id"], {"status": "paid"})
    return {"source": "simulated", "note": "Grievance resolved.", "grievance": store.find("grievances", grievance_id)}