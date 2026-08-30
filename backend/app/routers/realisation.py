from fastapi import APIRouter

from app.schemas import NetRealisationRequest
from app.services import ai

router = APIRouter(tags=["realisation"])


@router.post("/net-realisation")
def net_realisation(payload: NetRealisationRequest):
    return ai.calculate_net_realisation(
        crop=payload.crop,
        quantity_kg=payload.quantity_kg,
        quality=payload.quality,
        market=payload.market,
        buyer_id=payload.buyer_id,
        transport_cost=payload.transport_cost,
        storage_cost_per_kg=payload.storage_cost_per_kg,
        handling_cost_per_kg=payload.handling_cost_per_kg,
        expected_loss_pct=payload.expected_loss_pct,
    )