from datetime import date, datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class PriceForecastRequest(BaseModel):
    crop: str = "tomato"
    market: str = "Pimpalgaon"
    days: int = Field(default=7, ge=1, le=30)


class NetRealisationRequest(BaseModel):
    crop: str = "tomato"
    quantity_kg: float = Field(gt=0)
    quality: str = "A"
    market: str = "Pimpalgaon"
    buyer_id: Optional[str] = None
    transport_cost: float = Field(default=0, ge=0, description="Total transport cost in INR")
    storage_cost_per_kg: float = Field(default=0, ge=0)
    handling_cost_per_kg: float = Field(default=0, ge=0)
    expected_loss_pct: float = Field(default=4, ge=0, le=60)


class RecommendationRequest(BaseModel):
    crop: str = "tomato"
    quantity_kg: float = Field(gt=0)
    quality: str = "A"
    location: str = "Nashik"
    market: str = "Pimpalgaon"
    harvest_date: Optional[str] = None
    sell_within_days: int = Field(default=3, ge=0, le=365)
    farmer_id: Optional[str] = None


class BuyerMatchRequest(BaseModel):
    crop: str = "tomato"
    quantity_kg: float = Field(gt=0)
    quality: str = "A"
    location: str = "Nashik"
    market: str = "Pimpalgaon"


class FPOAggregateRequest(BaseModel):
    farmer_ids: list[str]
    crop: str = "tomato"
    quality: str = "A"
    market: str = "Pimpalgaon"
    fpo_id: Optional[str] = None


class LotCreateRequest(BaseModel):
    crop: str
    quantity_kg: float = Field(gt=0)
    quality: str
    location: str
    farmer_id: str = "f1"
    fpo_id: Optional[str] = None
    market: str = "Pimpalgaon"
    expected_price_per_kg: float = Field(gt=0)
    harvest_date: str
    description: str = ""


class OfferCreateRequest(BaseModel):
    lot_id: str
    buyer_id: str
    price_per_kg: float = Field(gt=0)
    quantity_kg: float = Field(gt=0)
    delivery_days: int = Field(default=2, ge=0, le=30)
    message: str = ""


class NegotiationRequest(BaseModel):
    offer_id: str
    side: Literal["buyer", "seller"]
    message: str
    price_per_kg: Optional[float] = None


class OrderCreateRequest(BaseModel):
    offer_id: str
    note: str = ""


class PaymentSettleRequest(BaseModel):
    order_id: str


class GrievanceCreateRequest(BaseModel):
    order_id: Optional[str] = None
    lot_id: Optional[str] = None
    category: Literal["payment", "quality", "logistics", "dispute", "other"]
    description: str
    raised_by: str = "farmer"
    status: str = "open"


class MarketTrendsQuery(BaseModel):
    crop: str = "tomato"
    days: int = Field(default=30, ge=7, le=90)


class LotsQuery(BaseModel):
    crop: Optional[str] = None
    status: Optional[str] = None
    origin: Optional[str] = None


class MetaMixin(BaseModel):
    source: str = "simulated"
    note: str = "Demo data. Replace with live mandi feed in production."


class SimulatedResponse(BaseModel):
    source: str = "simulated"
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    note: str = "Simulated demo data — not real market advice."


class AnyResponse(SimulatedResponse):
    data: Any = None