from fastapi import APIRouter, HTTPException

from app.database import store
from app.routers.orders import create_order_from_offer
from app.schemas import NegotiationRequest, OfferCreateRequest

router = APIRouter(tags=["offers"])


@router.get("/offers")
def list_offers(lot_id: str | None = None, buyer_id: str | None = None):
    rows = store.get("offers")
    if lot_id:
        rows = [r for r in rows if r["lot_id"] == lot_id]
    if buyer_id:
        rows = [r for r in rows if r["buyer_id"] == buyer_id]
    return {"source": "simulated", "note": "Offers on digital lots.", "offers": rows}


@router.post("/offers")
def create_offer(payload: OfferCreateRequest):
    lot = store.find("lots", payload.lot_id)
    buyer = store.find("buyers", payload.buyer_id)
    if not lot:
        raise HTTPException(404, "Lot not found")
    if not buyer:
        raise HTTPException(404, "Buyer not found")
    offer = store.insert("offers", {
        "lot_id": payload.lot_id, "buyer_id": payload.buyer_id,
        "buyer": buyer["company"], "price_per_kg": payload.price_per_kg,
        "quantity_kg": payload.quantity_kg, "delivery_days": payload.delivery_days,
        "message": payload.message, "status": "pending",
    })
    if lot.get("status") == "available":
        store.update("lots", lot["id"], {"status": "offered"})
    return {"source": "simulated", "note": "Offer placed on the digital lot.", "offer": offer, "lot": lot}


@router.post("/negotiations")
def negotiate(payload: NegotiationRequest):
    offer = store.find("offers", payload.offer_id)
    if not offer:
        raise HTTPException(404, "Offer not found")
    neg = store.insert("negotiations", {
        "offer_id": payload.offer_id, "side": payload.side, "message": payload.message,
        "price_per_kg": payload.price_per_kg,
    })
    store.update("offers", payload.offer_id, {"status": "countered"})
    lot = store.find("lots", offer["lot_id"])
    if lot and lot.get("status") in ("available", "offered"):
        store.update("lots", lot["id"], {"status": "negotiating"})
    updated = store.find("offers", payload.offer_id)
    return {"source": "simulated", "note": "Negotiation thread updated.", "negotiation": neg, "offer": updated}


@router.post("/offers/{offer_id}/accept")
def accept_offer(offer_id: str, note: str = ""):
    result = create_order_from_offer(offer_id, note)
    return {"source": "simulated", "note": "Offer accepted → order, logistics and payment created.",
            **result}