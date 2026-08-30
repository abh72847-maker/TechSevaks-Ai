from fastapi import APIRouter

from app.database import store
from app.schemas import BuyerMatchRequest
from app.services import ai

router = APIRouter(tags=["buyers"])


@router.post("/buyer-match")
def buyer_match(payload: BuyerMatchRequest):
    return ai.match_buyers(payload.crop, payload.quantity_kg, payload.quality,
                           payload.location, payload.market)


@router.get("/buyers")
def list_buyers():
    buyers = store.get("buyers")
    return {"source": "simulated", "note": "Demo buyer registry.", "buyers": buyers}


@router.get("/buyer-requirements")
def buyer_requirements(crop: str | None = None):
    out = []
    for b in store.get("buyers"):
        for rq in b.get("requirements", []):
            if crop and rq["crop"] != crop:
                continue
            out.append({"buyer_id": b["id"], "buyer": b["company"], "city": b["city"],
                        "reliability": b.get("reliability"), **rq})
    return {"source": "simulated", "note": "Active buyer demand bands.", "requirements": out}