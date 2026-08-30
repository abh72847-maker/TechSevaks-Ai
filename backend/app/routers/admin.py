from fastapi import APIRouter

from app.database import store

router = APIRouter(tags=["admin"])


@router.get("/admin/summary")
def admin_summary():
    lots = store.get("lots")
    orders = store.get("orders")
    payments = store.get("payments")
    grievances = store.get("grievances")
    status_counts: dict[str, int] = {}
    for lot in lots:
        status_counts[lot["status"]] = status_counts.get(lot["status"], 0) + 1
    return {
        "counts": {
            "farmers": len(store.get("farmers")), "buyers": len(store.get("buyers")),
            "fpos": len(store.get("fpos")), "crops": len(store.get("crops")),
            "markets": len(store.get("markets")), "lots": len(lots),
            "offers": len(store.get("offers")), "orders": len(orders),
            "payments": len(payments), "grievances": len(grievances),
        },
        "traded_volume_kg": round(sum(l["quantity_kg"] for l in lots), 0),
        "order_value_inr": round(sum(o["amount"] for o in orders), 2),
        "settled_inr": round(sum(p["amount"] for p in payments if p["status"] == "settled"), 2),
        "lot_status_distribution": status_counts,
        "grievance_open": len([g for g in grievances if g["status"] != "resolved"]),
        "recent_orders": sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:5],
        "avg_margin_pct": 18.4,
        "source": "simulated", "note": "Aggregate demo metrics.",
    }


@router.get("/farmers")
def list_farmers():
    return {"source": "simulated", "note": "Demo farmer registry.", "farmers": store.get("farmers")}


@router.get("/crops")
def list_crops():
    return {"source": "simulated", "note": "Demo crop catalogue.", "crops": store.get("crops")}


@router.get("/markets")
def list_markets():
    return {"source": "simulated", "note": "Demo market network.", "markets": store.get("markets")}