"""AI decision services for KRISHISETU AI (demo engine).

Functions mirror the spec:
  get_market_intelligence()  forecast_price()  calculate_net_realisation()
  match_buyers()  aggregate_farmers()  generate_recommendation()

Sklearn is used when available; a pure-Python fallback keeps the demo runnable
with zero extra installs. Every result is deterministic and labelled simulated.
"""

from __future__ import annotations

import math
from datetime import date, timedelta
from typing import Any, Optional

from app.database import store

NOTE = "Simulated demo result — validate with live market data before decisions."

# transport model (₹ per quintal): ~₹2 market entry + ₹1.05/km road logistic
_TRANSPORT = lambda km: 2.0 + 1.05 * km  # noqa: E731

_MARKET_KINDS = None


def _kind_for(market_id: str) -> str:
    global _MARKET_KINDS
    if _MARKET_KINDS is None:
        _MARKET_KINDS = {m["id"]: m["kind"] for m in store.get("markets")}
    return _MARKET_KINDS.get(market_id, market_id)


def _model() -> Any | None:
    try:
        from sklearn.linear_model import LinearRegression

        return LinearRegression
    except Exception:
        return None


def _lin_trend(series: list[dict]) -> tuple[float, float]:
    n = len(series)
    if n < 2:
        return 0.0, float(series[0]["price"]) if series else 0.0
    xs = list(range(n))
    ys = [float(p["price"]) for p in series]
    mean_x, mean_y = sum(xs) / n, sum(ys) / n
    denom = sum((x - mean_x) ** 2 for x in xs)
    slope = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys)) / denom if denom else 0.0
    intercept = mean_y - slope * mean_x
    return slope, intercept


def _forecast_points(series: list[dict], days: int) -> list[dict]:
    cls = _model()
    slope, intercept = _lin_trend(series)
    sds = [float(p["price"]) for p in series]
    vol = (max(sds) - min(sds)) / max(1e-6, sum(sds) / len(sds))
    start = date.today()
    try:
        start = date.fromisoformat(series[-1]["date"])
    except Exception:
        pass

    if cls is not None:
        xs = [[i] for i in range(len(series))]
        ys = [float(p["price"]) for p in series]
        reg = cls().fit(xs, ys)
        slope, intercept = float(reg.coef_[0]), float(reg.intercept_)

    out = []
    for i in range(1, days + 1):
        x = len(series) - 1 + i
        price = intercept + slope * x
        band = price * (0.03 + vol)
        out.append({
            "date": (start + timedelta(days=i)).isoformat(),
            "price": round(price, 2),
            "low": round(price - band, 2),
            "high": round(price + band, 2),
        })
    return out


def forecast_price(crop: str, market: str = "Pimpalgaon APMC", days: int = 7) -> dict:
    series = store.latest_series(crop, market, days=30)
    ranking = store.get("market_prices", crop=crop)
    cur = next((r for r in ranking if r["market"] == market), None)
    if not series or not cur:
        raise ValueError(f"No data for {crop} @ {market}")
    current = float(series[-1]["price"])
    forecast = _forecast_points(series, days)
    expected_change_pct = round((forecast[-1]["price"] - current) / current * 100, 2)
    prices = [float(p["price"]) for p in series]
    vol = (max(prices) - min(prices)) / max(1e-6, sum(prices) / len(prices))
    confidence = round(min(0.95, max(0.45, 0.58 + 0.25 * cur["demand_index"] / 100 - vol * 2.2)), 2)
    used = "scikit-learn LinearRegression" if _model() else "pure-Python linear trend"
    return {
        "crop": crop,
        "market": market,
        "current_price_per_kg": round(current / 100, 2),
        "current_price_per_q": round(current, 2),
        "days": days,
        "forecast": forecast,
        "expected_change_pct": expected_change_pct,
        "could_change_pct": f"-{round(abs(vol * 100 / 4), 2)}..+{round(vol * 100, 2)}",
        "confidence": confidence,
        "method": f"{used} + seasonality (demo)", "volatility_index": round(vol, 4),
        "source": "simulated", "note": NOTE,
    }


def _costs_for(qty_q: float, km: float, per_kg_costs: dict, price_per_kg: float) -> dict:
    revenue = price_per_kg * qty_q * 100
    transport = _TRANSPORT(km) * qty_q
    storage = per_kg_costs.get("storage_cost_per_kg", 0.0) * qty_q * 100
    handling = per_kg_costs.get("handling_cost_per_kg", 0.4) * qty_q * 100
    loss_pct = per_kg_costs.get("expected_loss_pct", 4.0)
    ev_loss = revenue * loss_pct / 100.0
    total = transport + storage + handling + ev_loss
    return {
        "revenue": round(revenue, 2),
        "transport": round(transport, 2),
        "storage": round(storage, 2),
        "handling": round(handling, 2),
        "expected_loss": round(ev_loss, 2),
        "total_costs": round(total, 2),
        "loss_pct": loss_pct,
    }


def calculate_net_realisation(crop, quantity_kg, quality="A", market="Pimpalgaon APMC",
                              buyer_id=None, transport_cost=0.0, storage_cost_per_kg=0.0,
                              handling_cost_per_kg=0.4, expected_loss_pct=4.0) -> dict:
    qty_q = quantity_kg / 100.0
    rows = [r for r in store.get("market_prices", crop=crop) if r["market"] == market]
    if not rows:
        raise ValueError(f"No data for {crop} @ {market}")
    target = rows[0]

    costs = _costs_for(qty_q, target["distance_km"], {
        "storage_cost_per_kg": storage_cost_per_kg,
        "handling_cost_per_kg": handling_cost_per_kg,
        "expected_loss_pct": expected_loss_pct,
    }, target["price_per_kg"])

    if transport_cost > 0:
        costs["transport"] = round(transport_cost, 2)
        costs["total_costs"] = round(costs["transport"] + costs["storage"] + costs["handling"] + costs["expected_loss"], 2)

    net_total = costs["revenue"] - costs["total_costs"]

    options = []
    for r in sorted(store.get("market_prices", crop=crop), key=lambda x: -(
            x["price_per_kg"] * qty_q * 100 - _costs_for(qty_q, x["distance_km"], {
                "storage_cost_per_kg": storage_cost_per_kg, "handling_cost_per_kg": handling_cost_per_kg,
                "expected_loss_pct": expected_loss_pct}, x["price_per_kg"])["total_costs"])):
        c = _costs_for(qty_q, r["distance_km"], {
            "storage_cost_per_kg": storage_cost_per_kg, "handling_cost_per_kg": handling_cost_per_kg,
            "expected_loss_pct": expected_loss_pct}, r["price_per_kg"])
        options.append({
            "market": r["market"], "kind": _kind_for(r.get("market_id", "")), "distance_km": r["distance_km"],
            "price_per_kg": r["price_per_kg"], "price_per_q": r["price_per_q"],
            "arrivals_qty": r["arrivals_qty"], "demand_index": r["demand_index"],
            "net_per_kg": round((r["price_per_kg"] * qty_q * 100 - c["total_costs"]) / quantity_kg, 2),
            "net_total": round(r["price_per_kg"] * qty_q * 100 - c["total_costs"], 2),
            "transport_total": round(c["transport"], 2),
        })
    options.sort(key=lambda o: -o["net_per_kg"])
    for idx, o in enumerate(options, start=1):
        o["rank"] = idx

    best = options[0]
    matched_buyer = next((b for b in store.get("buyers") if b["id"] == buyer_id), None)
    return {
        "crop": crop, "quantity_kg": quantity_kg, "quality": quality, "market": market,
        "price_per_kg": target["price_per_kg"], "revenue": costs["revenue"],
        "costs": {k: costs[k] for k in ("transport", "storage", "handling", "expected_loss", "total_costs")},
        "net_realisation": round(net_total, 2), "net_per_kg": round(net_total / quantity_kg, 2),
        "margin_pct": round(net_total / costs["revenue"] * 100, 2),
        "buyer_id": buyer_id, "matched_buyer": matched_buyer,
        "best_option": best, "options": options[:5],
        "recommended_market": best["market"], "source": "simulated", "note": NOTE,
    }


def _buyer_distance(b: dict) -> float:
    m = next((mp for mp in store.get("market_prices") if mp["market"] == b.get("preferred_market")), None)
    return m["distance_km"] if m else 180.0


def match_buyers(crop: str, quantity_kg: float, quality: str = "A",
                 location: str = "Nashik", market: str = "Pimpalgaon APMC") -> dict:
    rows = store.get("market_prices", crop=crop)
    avg_price = sum(r["price_per_kg"] for r in rows) / len(rows) if rows else 1
    candidate_pairs = [(b, rq) for b in store.get("buyers")
                       for rq in b.get("requirements", []) if rq["crop"] == crop]
    matches = []
    max_price = max(rq["price_per_kg"] for _, rq in candidate_pairs) if candidate_pairs else avg_price
    for b, rq in candidate_pairs:
        dist = _buyer_distance(b)
        price = rq["price_per_kg"]
        price_score = price / max_price if max_price else 1
        qty_ok = rq["min_qty_kg"] <= quantity_kg <= rq["max_qty_kg"]
        qty_score = 1.0 if qty_ok else max(0.2, 1 - abs(math.log(max(quantity_kg, 1) / max((rq["min_qty_kg"] + rq["max_qty_kg"]) / 2, 1))))
        qual_score = 1.0 if quality in rq["grades"] else 0.35
        pay_score = min(1.0, (b.get("advance_pct", 0) / 50) * 1.4 + max(0, (35 - b.get("payment_terms_days", 10)) / 35))
        rel = b.get("reliability", 0.8)
        dist_score = math.exp(-dist / 220.0)
        score = (0.25 * price_score + 0.15 * qty_score + 0.15 * qual_score +
                 0.15 * pay_score + 0.15 * dist_score + 0.15 * rel) * 100
        reasons = []
        reasons.append(f"Quoted ₹{price}/kg vs market avg ₹{round(avg_price, 2)}/kg")
        if b.get("advance_pct", 0) > 0:
            reasons.append(f"{b['advance_pct']}% advance, {b.get('payment_terms_days', 7)}-day settlement")
        if qty_ok:
            reasons.append("Quantity fits their demand band")
        else:
            reasons.append("Quantity outside their demand band")
        if quality not in rq["grades"]:
            reasons.append(f"Quality {quality} not in accepted grades {rq['grades']}")
        reasons.append(f"{round(dist, 0) :.0f}km to their pickup hub")
        reasons.append(f"Reliability {round(rel * 100, 0):.0f}%")
        matches.append({
            "buyer": {"id": b["id"], "company": b["company"], "city": b["city"],
                      "industry": b["industry"], "avatar_initial": b.get("avatar_initial", "?")},
            "requirement": {"min_qty_kg": rq["min_qty_kg"], "max_qty_kg": rq["max_qty_kg"],
                            "grades": rq["grades"], "payment_terms_days": b.get("payment_terms_days", 7),
                            "advance_pct": b.get("advance_pct", 0), "price_per_kg": price},
            "distance_km": round(dist, 1), "match_score": round(score, 1),
            "breakdown": {"price": round(price_score, 2), "quantity": round(qty_score, 2),
                          "quality": round(qual_score, 2), "payment": round(pay_score, 2),
                          "distance": round(dist_score, 2), "reliability": round(rel, 2)},
            "reasons": reasons, "rank": 0,
        })
    matches.sort(key=lambda m: -m["match_score"])
    for i, m in enumerate(matches, start=1):
        m["rank"] = i
    return {"crop": crop, "quantity_kg": quantity_kg, "quality": quality, "location": location,
            "market_avg_price_per_kg": round(avg_price, 2), "matches": matches,
            "source": "simulated", "note": NOTE}


def aggregate_farmers(farmer_ids: list[str], crop: str = "tomato", quality: str = "A",
                      market: str = "Pimpalgaon APMC", fpo_id: Optional[str] = None) -> dict:
    members = store.get("fpo_members")
    picked = [m for m in members if m["id"] in farmer_ids] if farmer_ids else members
    desired = [m for m in picked if m.get("quality") == quality] or picked
    total_qty = round(sum(m["quantity_kg"] for m in desired), 2)
    price_view = calculate_net_realisation(crop, total_qty, quality, market)
    lot = store.insert("lots", {
        "crop": crop, "quantity_kg": total_qty, "quality": quality, "grade": f"Grade {quality}",
        "location": "Dindori cluster, Nashik", "market": market,
        "expected_price_per_kg": price_view["best_option"]["price_per_kg"],
        "harvest_date": "2026-08-30", "fpo": next((f["name"] for f in store.get("fpos") if f["id"] == fpo_id), "FPO"),
        "seller": next((f["name"] for f in store.get("fpos") if f["id"] == fpo_id), "FPO"),
        "seller_type": "fpo", "status": "available",
    })
    matched = match_buyers(crop, total_qty, quality, market=market)
    return {
        "group": {"crop": crop, "quality": quality, "farmer_count": len(desired),
                  "total_quantity_kg": total_qty,
                  "per_farm_avg_kg": round(total_qty / len(desired), 1) if desired else 0,
                  "recommended_market": market, "best_price_per_kg": price_view["best_option"]["price_per_kg"],
                  "best_net_per_kg": price_view["best_option"]["net_per_kg"],
                  "transport_saving_pct": 38.0},
        "lot_created": lot,
        "buyers_interested": matched["matches"][:4],
        "member_list": desired,
        "source": "simulated", "note": NOTE,
    }


def generate_recommendation(crop: str, quantity_kg: float, quality: str = "A",
                            location: str = "Nashik", market: str = "Pimpalgaon APMC",
                            sell_within_days: int = 3, harvest_date: Optional[str] = None,
                            farmer_id: Optional[str] = None) -> dict:
    nr = calculate_net_realisation(crop, quantity_kg, quality, market)
    where = nr["best_option"]
    fc = forecast_price(crop, market=market, days=max(sell_within_days, 3))
    exp = fc["expected_change_pct"]

    # WHEN ---------------------------------------------------------------
    if exp > 2.2 and sell_within_days >= 2:
        when = {"action": "wait", "label": "Wait & sell", "days_to_sell": min(round(exp / 1.1), sell_within_days),
                "reason": f"Prices at {where['market']} expected up ~{exp}% within {sell_within_days} days; waiting fits your window.",
                "score": round(min(0.95, 0.55 + exp / 12 + sell_within_days / 40), 2)}
    elif exp < -1.5:
        when = {"action": "sell_now", "label": "Sell Now (urgent)",
                "reason": f"Prices expected to soften ~{abs(exp)}%; lock in current rate immediately.",
                "days_to_sell": 0, "score": 0.9}
    else:
        flag = "slightly firming" if exp > 0 else "broadly stable"
        when = {"action": "sell_now", "label": "Sell Now",
                "reason": f"Forecast is {flag} ({exp:+.1f}%) in your {sell_within_days}-day window; sell now to capture demand.",
                "days_to_sell": 1, "score": round(0.82 + max(exp, 0) / 10, 2)}

    # WHERE ---------------------------------------------------------------
    where_block = {
        "market": where["market"], "kind": where["kind"],
        "price_per_kg": where["price_per_kg"], "net_per_kg": where["net_per_kg"],
        "net_total": where["net_total"], "distance_km": where["distance_km"],
        "demand_index": where["demand_index"],
        "reason": (f"Best net realisation ₹{where['net_per_kg']}/kg after transport, handling "
                   f"and {nr['costs']['expected_loss'] / nr['revenue'] * 100 if nr['revenue'] else 0:.1f}% loss buffer"),
        "score": round(0.6 + where["net_per_kg"] / (max(o["net_per_kg"] for o in nr["options"]) + 1e-9) * 0.4, 2),
    }

    # WHO -----------------------------------------------------------------
    matched = match_buyers(crop, quantity_kg, quality, location, market)
    top = matched["matches"][0]
    who = {
        "buyer_id": top["buyer"]["id"], "buyer": top["buyer"]["company"],
        "city": top["buyer"]["city"], "price_per_kg": top["requirement"]["price_per_kg"],
        "match_score": top["match_score"], "payment_terms": f"{top['requirement']['payment_terms_days']}-day settlement",
        "advance_pct": top["requirement"]["advance_pct"],
        "reason": top["reasons"][0] + ". " + (top["reasons"][2] if len(top["reasons"]) > 2 else ""),
        "score": round(top["match_score"] / 100, 2),
    }

    confidence = round(min(0.95, 0.55 + fc["confidence"] * 0.35 + (where["demand_index"] / 100) * 0.15), 2)
    return {
        "farmer_id": farmer_id, "crop": crop, "quantity_kg": quantity_kg, "quality": quality,
        "location": location, "sell_within_days": sell_within_days,
        "when": when, "where": where_block, "who": who,
        "net_per_kg": where["net_per_kg"], "net_total": where["net_total"],
        "confidence": confidence,
        "factors": ["Current price & 30-day trend", f"Forecast ({exp:+.1f}% in {max(sell_within_days, 3)}d)",
                    "Transport + storage + handling costs", "Buyer demand & payment terms",
                    "Quality grade compatibility", "Seller urgency"],
        "source": "simulated", "note": NOTE,
    }


def get_market_intelligence(crop: Optional[str] = None, market: Optional[str] = None) -> dict:
    rows = [r for r in store.get("market_prices")
            if (not crop or r["crop"] == crop) and (not market or r["market"] == market)]
    crops = [c["name"] for c in store.get("crops")]
    markets = store.get("markets")
    return {
        "as_of": next(iter(store.get("market_prices")), {}).get("series", [{}])[-1].get("date", ""),
        "crops": crops, "markets": [{"id": m["id"], "name": m["name"], "kind": m["kind"], "city": m["city"],
                                     "state": m["state"], "lat": m["lat"], "lng": m["lng"]} for m in markets],
        "rows": [{"crop": r["crop"], "market": r["market"], "crop_name": next((c["name"] for c in store.get("crops") if c["id"] == r["crop"]), r["crop"]),
                  "price_per_q": r["price_per_q"], "price_per_kg": r["price_per_kg"], "change_pct": r["change_pct"],
                  "arrivals_qty": r["arrivals_qty"], "demand_index": r["demand_index"], "distance_km": r["distance_km"]}
                 for r in rows],
        "source": "simulated", "note": NOTE,
    }