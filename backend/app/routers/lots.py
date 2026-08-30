from fastapi import APIRouter, HTTPException

from app.database import store
from app.schemas import LotCreateRequest

router = APIRouter(tags=["lots"])


@router.get("/lots")
def list_lots(crop: str | None = None, status: str | None = None):
    rows = store.get("lots")
    if crop:
        rows = [r for r in rows if r["crop"] == crop]
    if status:
        rows = [r for r in rows if r["status"] == status]
    return {"source": "simulated", "note": "Digital lots (demo).", "lots": rows}


@router.get("/lots/{lot_id}")
def lot_detail(lot_id: str):
    lot = store.find("lots", lot_id)
    if not lot:
        raise HTTPException(404, "Lot not found")
    offers = store.get("offers", lot_id=lot_id)
    negotiations = []
    for o in offers:
        negotiations += store.get("negotiations", offer_id=o["id"])
    quality = next((q for q in []), None)
    return {"lot": lot, "offers": offers, "negotiations": negotiations,
            "quality": quality, "source": "simulated", "note": "Lot record with offers and negotiation history."}


@router.post("/lots")
def create_lot(payload: LotCreateRequest):
    lot = store.insert("lots", {
        "crop": payload.crop, "quantity_kg": payload.quantity_kg, "quality": payload.quality,
        "grade": f"Grade {payload.quality}", "location": payload.location,
        "market": payload.market, "expected_price_per_kg": payload.expected_price_per_kg,
        "harvest_date": payload.harvest_date, "description": payload.description,
        "fpo": next((f["name"] for f in store.get("fpos") if f["id"] == payload.fpo_id), "Direct"),
        "seller": next((f["name"] for f in store.get("farmers") if f["id"] == payload.farmer_id), "Farmer"),
        "seller_type": "fpo" if payload.fpo_id else "farmer", "status": "available",
    })
    return {"source": "simulated", "note": "Digital lot created (demo in-memory).", "lot": lot}