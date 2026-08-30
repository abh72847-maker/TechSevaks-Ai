from fastapi import APIRouter

from app.database import store

router = APIRouter(tags=["logistics"])


@router.get("/logistics")
def list_logistics(order_id: str | None = None):
    rows = store.get("logistics")
    if order_id:
        rows = [r for r in rows if r["order_id"] == order_id]
    return {"source": "simulated", "note": "Transport & delivery pipeline.", "logistics": rows}


@router.post("/logistics/{logistics_id}/advance")
def advance_logistics(logistics_id: str):
    current = store.find("logistics", logistics_id)
    if not current:
        return {"error": "not found"}
    nxt = {"scheduled": "in_transit", "in_transit": "delivered", "delivered": "delivered"}.get(current["status"], current["status"])
    store.update("logistics", logistics_id, {"status": nxt})
    if nxt == "delivered":
        order = next((o for o in store.get("orders") if o["id"] == current["order_id"]), None)
        if order:
            store.update("orders", current["order_id"], {"status": "delivered"})
            store.update("lots", order["lot_id"], {"status": "delivered"})
    return {"source": "simulated", "note": "Logistics status advanced (demo).",
            "logistics": store.find("logistics", logistics_id)}