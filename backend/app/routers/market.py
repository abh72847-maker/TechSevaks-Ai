from fastapi import APIRouter, Query

from app.services import ai

router = APIRouter(tags=["market"])


@router.get("/market-prices")
def market_prices(crop: str | None = Query(None), market: str | None = Query(None)):
    return ai.get_market_intelligence(crop=crop, market=market)


@router.get("/market-trends")
def market_trends(crop: str = Query("tomato"), days: int = Query(30, ge=7, le=90)):
    series = {}
    for row in ai.store.get("market_prices", crop=crop):
        series[row["market"]] = [{"date": p["date"], "price": p["price_per_kg"]}
                                 for p in row["series"][-days:]]
    return {
        "crop": crop, "days": days, "markets": list(series.keys()), "series": series,
        "source": "simulated", "note": "Simulated 30-day price series per market (₹/kg).",
    }