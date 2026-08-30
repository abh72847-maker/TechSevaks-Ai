"""Realistic, deterministic demo datasets for KRISHISETU AI (INR).

All figures are simulated placeholders — clearly labelled as such in every API
response. In production these tables are replaced by live mandi feeds
(AGMARKNET / eNAM / AMA) and PostgreSQL.
"""

import random
from datetime import date, timedelta

TODAY = date(2026, 8, 30)

_rng = random.Random(7)

# ---------------------------------------------------------------- crops
CROPS = [
    {"id": "tomato", "name": "Tomato", "category": "Vegetable", "season": "Kharif/Rabi", "base_price_q": 1450},
    {"id": "onion", "name": "Onion", "category": "Vegetable", "season": "Rabi", "base_price_q": 1850},
    {"id": "potato", "name": "Potato", "category": "Vegetable", "season": "Rabi", "base_price_q": 1350},
    {"id": "chilli", "name": "Chilli", "category": "Spice", "season": "Kharif", "base_price_q": 7800},
    {"id": "brinjal", "name": "Brinjal", "category": "Vegetable", "season": "Kharif", "base_price_q": 1250},
    {"id": "cabbage", "name": "Cabbage", "category": "Vegetable", "season": "Rabi", "base_price_q": 1050},
    {"id": "cauliflower", "name": "Cauliflower", "category": "Vegetable", "season": "Rabi", "base_price_q": 1600},
    {"id": "soybean", "name": "Soybean", "category": "Oilseed", "season": "Kharif", "base_price_q": 4100},
    {"id": "cotton", "name": "Cotton", "category": "Fibre", "season": "Kharif", "base_price_q": 6850},
]

# ---------------------------------------------------------------- markets
MARKETS = [
    {"id": "pimpalgaon", "name": "Pimpalgaon APMC", "kind": "APMC (Tomato hub)", "city": "Pimpalgaon", "district": "Nashik", "state": "Maharashtra", "lat": 20.0750, "lng": 74.0290, "multiplier": 1.38},
    {"id": "nashik_apmc", "name": "Nashik APMC", "kind": "APMC", "city": "Nashik", "district": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lng": 73.7898, "multiplier": 1.12},
    {"id": "lasalgaon", "name": "Lasalgaon APMC", "kind": "APMC (Onion hub)", "city": "Lasalgaon", "district": "Nashik", "state": "Maharashtra", "lat": 20.1347, "lng": 74.2494, "multiplier": 1.18},
    {"id": "manmad", "name": "Manmad Market Yard", "kind": "Market yard", "city": "Manmad", "district": "Nashik", "state": "Maharashtra", "lat": 20.2503, "lng": 74.4375, "multiplier": 0.96},
    {"id": "narayangaon", "name": "Narayangaon Mandi", "kind": "Tomato hub", "city": "Narayangaon", "district": "Pune", "state": "Maharashtra", "lat": 19.1210, "lng": 73.9830, "multiplier": 1.05},
    {"id": "vashi", "name": "Vashi APMC (Navi Mumbai)", "kind": "Metro APMC", "city": "Navi Mumbai", "district": "Thane", "state": "Maharashtra", "lat": 19.0610, "lng": 73.0010, "multiplier": 1.42},
    {"id": "hadapsar", "name": "Hadapsar Market Yard (Pune)", "kind": "APMC", "city": "Pune", "district": "Pune", "state": "Maharashtra", "lat": 18.5080, "lng": 73.9250, "multiplier": 1.26},
    {"id": "azadpur", "name": "Azadpur Mandi (Delhi)", "kind": "Metro APMC", "city": "Delhi", "district": "North Delhi", "state": "Delhi", "lat": 28.7030, "lng": 77.1780, "multiplier": 1.55},
]

# estimated straight-line haversine distances from Nashik farm belt (km) for demo
_MARKET_KM = {
    "pimpalgaon": 28.0,
    "nashik_apmc": 18.0,
    "lasalgaon": 82.0,
    "manmad": 60.0,
    "narayangaon": 98.0,
    "vashi": 172.0,
    "hadapsar": 208.0,
    "azadpur": 1420.0,
}


def _gen_series(base: float, days: int = 30) -> list[dict]:
    s = []
    price = base * (1 - 0.06 + _rng.random() * 0.04)
    for i in range(days):
        drift = 0.002 + (_rng.random() - 0.5) * 0.012
        price = max(base * 0.8, price * (1 + drift))
        d = TODAY - timedelta(days=days - 1 - i)
        s.append({"date": d.isoformat(), "price": round(price, 2)})
    return s


def build_market_prices() -> list[dict]:
    rows = []
    for crop in CROPS:
        for m in MARKETS:
            base = crop["base_price_q"] * m["multiplier"]
            jitter = 1 + (_rng.random() - 0.5) * 0.06
            price_q = base * jitter
            prev_q = price_q / (1 + (_rng.random() - 0.5) * 0.06)
            change = (price_q - prev_q) / prev_q * 100
            arrivals = round(_rng.uniform(250, 1450), 0)
            demand = round(_rng.uniform(48, 96), 0)
            series = _gen_series(price_q)
            rows.append({
                "crop": crop["id"],
                "market": m["name"],
                "market_id": m["id"],
                "price_per_q": round(price_q, 2),
                "price_per_kg": round(price_q / 100, 2),
                "change_pct": round(change, 2),
                "arrivals_qty": arrivals,
                "arrivals_unit": "quintals",
                "demand_index": demand,
                "series": series,
                "distance_km": _MARKET_KM[m["id"]],
            })
    return rows


# ---------------------------------------------------------------- users / personas
FARMERS = [
    {
        "id": "f1", "name": "Ramesh Patil", "name_hi": "रमेश पाटील",
        "location": "Village Wadivihir, Nashik", "district": "Nashik", "state": "Maharashtra",
        "farm_size_acres": 4.2, "primary_crops": ["tomato", "onion"],
        "banking": "Yes", "kisan_credit_card": "Yes", "reliability": 0.87,
        "phone": "98230 12345", "avatar_initial": "RP",
    },
    {
        "id": "f2", "name": "Sunita More", "name_hi": "सुनीता मोरे",
        "location": "Village Palkhed, Nashik", "district": "Nashik", "state": "Maharashtra",
        "farm_size_acres": 2.8, "primary_crops": ["tomato"], "banking": "Yes",
        "kisan_credit_card": "No", "reliability": 0.81, "phone": "98230 33456",
        "avatar_initial": "SM",
    },
]

def make_fpo_members(n: int = 12) -> list[dict]:
    first = ["Dattatray", "Ganesh", "Kiran", "Mahesh", "Pravin", "Sagar", "Vilas", "Ashok", "Dilip", "Kailas", "Bhausaheb", "Shravan"]
    out = []
    for i in range(n):
        qty = round(_rng.uniform(400, 2600), 0)
        out.append({
            "id": f"m{i+3}",
            "name": first[i] + " Jadhav",
            "location": f"Village {i+1}, Dindori",
            "quantity_kg": qty,
            "quality": "A" if i % 3 != 0 else "B",
            "harvest_date": (TODAY - timedelta(days=1 + i % 4)).isoformat(),
        })
    return out

FPO_MEMBERS = make_fpo_members()

FPOS = [
    {"id": "fpo1", "name": "Nashik Tomato Growers FPO", "district": "Nashik", "state": "Maharashtra",
     "member_count": 212, "reliability": 0.9, "location": "Nashik", "founded": 2019},
    {"id": "fpo2", "name": "Dindori Arpan FPO", "district": "Nashik", "state": "Maharashtra",
     "member_count": 158, "reliability": 0.85, "location": "Dindori, Nashik", "founded": 2021},
]

BUYERS = [
    {"id": "b1", "company": "AgroFresh Retail Pvt Ltd", "city": "Nashik", "industry": "Modern retail",
     "payment_terms_days": 7, "advance_pct": 20, "reliability": 0.9, "avatar_initial": "AG",
     "preferred_market": "Pimpalgaon APMC", "max_distance_km": 150,
     "requirements": [
         {"crop": "tomato", "grades": ["A"], "min_qty_kg": 500, "max_qty_kg": 4000, "price_per_kg": 19.2},
         {"crop": "onion", "grades": ["A", "B"], "min_qty_kg": 1000, "max_qty_kg": 6000, "price_per_kg": 25.5},
     ]},
    {"id": "b2", "company": "Star Agri Exports", "city": "Nashik", "industry": "Export",
     "payment_terms_days": 0, "advance_pct": 50, "reliability": 0.93, "avatar_initial": "SE",
     "preferred_market": "Nashik APMC", "max_distance_km": 120,
     "requirements": [
         {"crop": "tomato", "grades": ["A"], "min_qty_kg": 1000, "max_qty_kg": 8000, "price_per_kg": 19.4},
     ]},
    {"id": "b3", "company": "GreenBasket Mart (Pune)", "city": "Pune", "industry": "Supermarket chain",
     "payment_terms_days": 10, "advance_pct": 10, "reliability": 0.84, "avatar_initial": "GB",
     "preferred_market": "Hadapsar Market", "max_distance_km": 260,
     "requirements": [
         {"crop": "tomato", "grades": ["A", "B"], "min_qty_kg": 800, "max_qty_kg": 3000, "price_per_kg": 17.8},
         {"crop": "potato", "grades": ["A"], "min_qty_kg": 1000, "max_qty_kg": 6000, "price_per_kg": 15.2},
     ]},
    {"id": "b4", "company": "FreshNation Distribution", "city": "Navi Mumbai", "industry": "Fresh distribution",
     "payment_terms_days": 5, "advance_pct": 25, "reliability": 0.88, "avatar_initial": "FN",
     "preferred_market": "Vashi APMC", "max_distance_km": 220,
     "requirements": [
         {"crop": "tomato", "grades": ["A", "B"], "min_qty_kg": 1000, "max_qty_kg": 5000, "price_per_kg": 18.4},
     ]},
    {"id": "b5", "company": "Delhi Spice & Veg Traders", "city": "Delhi", "industry": "Wholesale trading",
     "payment_terms_days": 14, "advance_pct": 0, "reliability": 0.79, "avatar_initial": "DS",
     "preferred_market": "Azadpur Mandi", "max_distance_km": 1600,
     "requirements": [
         {"crop": "tomato", "grades": ["B", "C"], "min_qty_kg": 2000, "max_qty_kg": 10000, "price_per_kg": 19.6},
         {"crop": "chilli", "grades": ["A"], "min_qty_kg": 500, "max_qty_kg": 3000, "price_per_kg": 82.0},
     ]},
]


def build_lots() -> list[dict]:
    lots = [
        {"id": "KSL-1001", "crop": "tomato", "quantity_kg": 1500, "quality": "A", "grade": "Grade A",
         "location": "Wadivihir, Nashik", "market": "Pimpalgaon APMC",
         "expected_price_per_kg": 18.9, "harvest_date": "2026-08-27", "fpo": "Nashik Tomato Growers FPO",
         "seller": "Ramesh Patil", "seller_type": "farmer", "status": "negotiating"},
        {"id": "KSL-1002", "crop": "tomato", "quantity_kg": 3400, "quality": "A", "grade": "Grade A",
         "location": "Dindori cluster, Nashik", "market": "Pimpalgaon APMC",
         "expected_price_per_kg": 19.1, "harvest_date": "2026-08-28", "fpo": "Dindori Arpan FPO",
         "seller": "Dindori Arpan FPO", "seller_type": "fpo", "status": "available"},
        {"id": "KSL-1003", "crop": "onion", "quantity_kg": 5200, "quality": "B", "grade": "Grade B",
         "location": "Lasalgaon cluster, Nashik", "market": "Lasalgaon APMC",
         "expected_price_per_kg": 24.8, "harvest_date": "2026-08-29", "fpo": "Nashik Tomato Growers FPO",
         "seller": "Nashik Tomato Growers FPO", "seller_type": "fpo", "status": "offered"},
        {"id": "KSL-1004", "crop": "potato", "quantity_kg": 4700, "quality": "A", "grade": "Grade A",
         "location": "Igatpuri, Nashik", "market": "Hadapsar Market",
         "expected_price_per_kg": 14.6, "harvest_date": "2026-08-25", "fpo": "—",
         "seller": "Sunita More", "seller_type": "farmer", "status": "in_transit"},
        {"id": "KSL-1005", "crop": "tomato", "quantity_kg": 900, "quality": "B", "grade": "Grade B",
         "location": "Wadivihir, Nashik", "market": "Narayangaon Mandi",
         "expected_price_per_kg": 14.2, "harvest_date": "2026-08-29", "fpo": "—",
         "seller": "Ramesh Patil", "seller_type": "farmer", "status": "available"},
        {"id": "KSL-1006", "crop": "soybean", "quantity_kg": 8400, "quality": "A", "grade": "Grade A",
         "location": "Malegaon, Nashik", "market": "Nashik APMC",
         "expected_price_per_kg": 40.5, "harvest_date": "2026-09-05", "fpo": "Dindori Arpan FPO",
         "seller": "Dindori Arpan FPO", "seller_type": "fpo", "status": "delivered"},
        {"id": "KSL-1007", "crop": "chilli", "quantity_kg": 620, "quality": "A", "grade": "Grade A",
         "location": "Niphad, Nashik", "market": "Vashi APMC",
         "expected_price_per_kg": 78.5, "harvest_date": "2026-08-26", "fpo": "—",
         "seller": "Sunita More", "seller_type": "farmer", "status": "available"},
        {"id": "KSL-1008", "crop": "tomato", "quantity_kg": 1800, "quality": "A", "grade": "Grade A",
         "location": "Dindori cluster, Nashik", "market": "Pimpalgaon APMC",
         "expected_price_per_kg": 18.8, "harvest_date": "2026-08-27", "fpo": "Dindori Arpan FPO",
         "seller": "Dindori Arpan FPO", "seller_type": "fpo", "status": "in_transit"},
    ]
    return lots


_LOT_LINK = {"KSL-1001": "b2", "KSL-1003": "b1", "KSL-1004": "b3", "KSL-1006": "b2", "KSL-1008": "b4"}


def build_offers(lots) -> list[dict]:
    status_map = {"KSL-1001": "countered", "KSL-1003": "pending", "KSL-1004": "accepted",
                  "KSL-1006": "accepted", "KSL-1008": "pending"}
    offers = []
    i = 1
    for lot in lots:
        b = _LOT_LINK.get(lot["id"])
        if not b:
            continue
        price = round(lot["expected_price_per_kg"] * (_rng.uniform(0.94, 1.06)), 2)
        offers.append({
            "id": f"OOF-{1000+i}", "lot_id": lot["id"], "buyer_id": b,
            "price_per_kg": price, "quantity_kg": lot["quantity_kg"],
            "delivery_days": 2, "status": status_map.get(lot["id"], "pending"),
            "message": "Interested in this lot. Price negotiable.",
        })
        i += 1
    return offers


def patch_links(offers, lots):
    companies = {b["id"]: b for b in BUYERS}
    add_buyer = {
        "OOF-1002": ["AgroFresh Retail has countered.", "negotiating"],
        "OOF-1001": ["Counter offer: ₹19.6/kg with 50% advance.", "negotiating"],
    }
    for o in offers:
        o["buyer"] = companies[o["buyer_id"]]["company"]
        o["lot"] = next((l for l in lots if l["id"] == o["lot_id"]), None)
    return offers


def build_orders(lots, offers) -> tuple[list[dict], list[dict], list[dict]]:
    orders, logistics, payments = [], [], []
    pairs = [("KSL-1004", "OOF-1002", "delivered"), ("KSL-1006", "OOF-1004", "paid"), ("KSL-1008", "OOF-1005", "in_transit")]
    for i, (lot_id, of_id, status) in enumerate(pairs, start=1):
        lot = next(l for l in lots if l["id"] == lot_id)
        offer = next(o for o in offers if o["id"] == of_id)
        amount = round(offer["price_per_kg"] * lot["quantity_kg"], 2)
        order = {"id": f"ORD-{3000+i}", "lot_id": lot_id, "offer_id": of_id, "buyer_id": offer["buyer_id"],
                 "buyer": offer["buyer"], "amount": amount, "status": status, "note": "", "created_at": "2026-08-28T09:30:00Z"}
        orders.append(order)
        status_l = "delivered" if status == "delivered" else ("in_transit" if status == "in_transit" else "delivered")
        logistics.append({
            "id": f"LOG-{2000+i}", "order_id": order["id"], "carrier": "Nashik RoadLink Cargo",
            "from": lot["location"], "to": offer.get("lot", {}).get("market", "Vashi APMC"),
            "distance_km": 48 if i == 1 else (1420 if i == 2 else 172),
            "cost": round(0.45 * (48 if i == 1 else (208 if i == 2 else 172)) * lot["quantity_kg"] / 100, 0),
            "eta": "2026-08-31T10:00:00Z", "status": status_l,
        })
        payments.append({"id": f"PAY-{4000+i}", "order_id": order["id"], "amount": amount,
                         "status": "settled" if status == "paid" else "pending", "method": "UPI / NEFT"})
    return orders, logistics, payments


def build_grievances(orders) -> list[dict]:
    return [
        {"id": "GRV-9001", "order_id": "ORD-3001", "lot_id": "KSL-1004", "category": "quality",
         "description": "3% blemish beyond agreed grade on arrival inspection.", "status": "review",
         "raised_by": "buyer", "resolution": ""},
        {"id": "GRV-9002", "order_id": "ORD-3002", "lot_id": "KSL-1006", "category": "payment",
         "description": "Settlement delay beyond committed 7 days.", "status": "resolved", "raised_by": "farmer",
         "resolution": "Settled via UPI on 2026-08-29."},
    ]


def build_price_probe(crop: str = "tomato", days: int = 7) -> dict:
    return {
        "crop": crop, "days": days, "anchors": [
            {"date": (TODAY + timedelta(days=i)).isoformat(), "price": round(19.1 + i * 0.12, 2)} for i in range(days)
        ],
    }


def build_all() -> dict:
    market_prices = build_market_prices()
    lots = build_lots()
    offers = patch_links(build_offers(lots), lots)
    orders, logistics, payments = build_orders(lots, offers)
    grievances = build_grievances(orders)

    return {
        "as_of": TODAY.isoformat(),
        "crops": CROPS,
        "markets": MARKETS,
        "market_prices": market_prices,
        "farmers": FARMERS + FPO_MEMBERS,
        "fpo_members": FPO_MEMBERS,
        "fpos": FPOS,
        "buyers": BUYERS,
        "lots": lots,
        "offers": offers,
        "negotiations": [
            {"id": "NEG-8001", "offer_id": "OOF-1001", "side": "seller", "message": "We can accept ₹19.4/kg if pickup is from farm gate.", "price_per_kg": None},
            {"id": "NEG-8002", "offer_id": "OOF-1001", "side": "buyer", "message": "Deal at ₹19.6/kg with 50% advance paid on confirmation.", "price_per_kg": 19.6},
        ],
        "orders": orders,
        "logistics": logistics,
        "payments": payments,
        "grievances": grievances,
        "transactions": [{"id": f"TXN-{7000+i}", "order_id": o["id"], "amount": o["amount"],
                          "kind": "sale", "fee_pct": 0.005} for i, o in enumerate(orders)],
    }


SEED = build_all()