from fastapi import APIRouter

from app.schemas import RecommendationRequest
from app.services import ai

router = APIRouter(tags=["recommendation"])


@router.post("/recommendation")
def recommendation(payload: RecommendationRequest):
    return ai.generate_recommendation(
        crop=payload.crop,
        quantity_kg=payload.quantity_kg,
        quality=payload.quality,
        location=payload.location,
        market=payload.market,
        harvest_date=payload.harvest_date,
        sell_within_days=payload.sell_within_days,
        farmer_id=payload.farmer_id,
    )