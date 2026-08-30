from fastapi import APIRouter

from app.schemas import PriceForecastRequest
from app.services import ai

router = APIRouter(tags=["forecast"])


@router.post("/price-forecast")
def price_forecast(payload: PriceForecastRequest):
    return ai.forecast_price(payload.crop, payload.market, payload.days)