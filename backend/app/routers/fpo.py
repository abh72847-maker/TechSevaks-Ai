from fastapi import APIRouter

from app.database import store
from app.schemas import FPOAggregateRequest
from app.services import ai

router = APIRouter(tags=["fpo"])


@router.get("/fpos")
def list_fpos():
    return {"source": "simulated", "note": "Demo FPO registry.", "fpos": store.get("fpos")}


@router.get("/fpo/dashboard")
def fpo_dashboard(fpo_id: str = "fpo1"):
    fpos = store.get("fpos")
    fpo = next((f for f in fpos if f["id"] == fpo_id), fpos[0])
    members = store.get("fpo_members")
    lots = [l for l in store.get("lots") if l.get("seller_type") == "fpo"]
    offers = store.get("offers")
    return {
        "fpo": fpo,
        "members": members,
        "total_member_quantity_kg": round(sum(m["quantity_kg"] for m in members), 2),
        "grade_a_share_pct": round(sum(m["quantity_kg"] for m in members if m["quality"] == "A")
                                   / sum(m["quantity_kg"] for m in members) * 100, 1),
        "lots": lots,
        "open_offers": [o for o in offers if o.get("status") in ("pending", "countered")],
        "source": "simulated", "note": "Demo FPO workspace.",
    }


@router.post("/fpo/aggregate")
def fpo_aggregate(payload: FPOAggregateRequest):
    return ai.aggregate_farmers(payload.farmer_ids, payload.crop, payload.quality,
                                payload.market, payload.fpo_id)