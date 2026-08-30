from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException

from app.database import store
from app.schemas import OrderCreateRequest, PaymentSettleRequest

router = APIRouter(tags=["orders"])

_MARKET_KM = {"Pimpalgaon APMC": 28.0, "Nashik APMC": 18.0, "Lasalgaon APMC": 82.0,
              "Vashi APMC (Navi Mumbai)": 172.0, "Hadapsar Market Yard (Pune)": 208.0,
              "Azadpur Mandi (Delhi)": 1420.0, "Manmad Market Yard": 60.0, "Narayangaon Mandi": 98.0}


def create_order_from_offer(offer_id: str, note: str = ""):
    offer = store.find("offers", offer_id)
    if not offer:
        raise HTTPException(404, "Offer not found")
    lot = store.find("lots", offer["lot_id"])
    if not lot:
        raise HTTPException(404, "Lot not found")
    buyer = store.find("buyers", offer["buyer_id"])
    amount = round(offer["price_per_kg"] * lot["quantity_kg"], 2)

    order = store.insert("orders", {
        "lot_id": lot["id"], "offer_id": offer["id"], "buyer_id": buyer["id"],
        "buyer": buyer["company"], "amount": amount, "status": "confirmed", "note": note,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    distance = _MARKET_KM.get(lot.get("market", ""), 100.0)
    cost = round(max(250, (2 + 1.05 * distance) * (lot["quantity_kg"] / 100)), 0)
    logistics = store.insert("logistics", {
        "order_id": order["id"], "carrier": "Nashik RoadLink Cargo",
        "from": lot["location"], "to": lot.get("market", "Destination"),
        "distance_km": distance, "cost": cost,
        "eta": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "status": "scheduled",
    })
    payment = store.insert("payments", {
        "order_id": order["id"], "amount": amount, "status": "pending", "method": "UPI / NEFT",
    })
    store.update("offers", offer["id"], {"status": "accepted"})
    store.update("lots", lot["id"], {"status": "order_confirmed", "status_order": 4})
    store.insert("transactions", {"order_id": order["id"], "amount": amount, "kind": "sale", "fee_pct": 0.005})
    return {"order": order, "logistics": logistics, "payment": payment, "lot": lot}


@router.get("/orders")
def list_orders():
    return {"source": "simulated", "note": "Confirmed orders.", "orders": store.get("orders")}


@router.post("/orders")
def create_order(payload: OrderCreateRequest):
    created = create_order_from_offer(payload.offer_id, payload.note)
    return {"source": "simulated", "note": "Order confirmed and pipeline created.", **created}


@router.get("/payments")
def list_payments():
    return {"source": "simulated", "note": "Payment ledger.", "payments": store.get("payments")}


@router.post("/payments/settle")
def settle_payment(payload: PaymentSettleRequest):
    pay = next((p for p in store.get("payments") if p["order_id"] == payload.order_id), None)
    if not pay:
        raise HTTPException(404, "Payment not found")
    store.update("payments", pay["id"], {"status": "settled"}, where={"order_id": payload.order_id})
    store.update("orders", payload.order_id, {"status": "paid"})
    lot_ids = [o["lot_id"] for o in store.get("orders") if o["id"] == payload.order_id]
    for lid in lot_ids:
        store.update("lots", lid, {"status": "paid"})
    return {"source": "simulated", "note": "Payment settled (demo).", "payment": store.find("payments", pay["id"])}