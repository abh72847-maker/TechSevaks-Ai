"""PostgreSQL target schema for KRISHISETU AI.

In demo mode the app serves the identical structures from the seeded in-memory
store (backend/app/seed.py). Activating Postgres is a config-only change:
set DATA_MODE='postgres' and implement a live market provider.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


def _ts():
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"
    id = Column(String(32), primary_key=True)
    name = Column(String(120), nullable=False)
    role = Column(Enum("farmer", "buyer", "fpo", "admin", name="user_role"))
    phone = Column(String(15))
    created_at = Column(DateTime, default=_ts)


class Farmer(Base):
    __tablename__ = "farmers"
    id = Column(String(32), primary_key=True)
    user_id = Column(String(32), ForeignKey("users.id"))
    location = Column(String(120))
    district = Column(String(120))
    state = Column(String(64))
    farm_size_acres = Column(Float)
    primary_crops = Column(String(255))
    reliability_score = Column(Float, default=0.8)
    created_at = Column(DateTime, default=_ts)


class Buyer(Base):
    __tablename__ = "buyers"
    id = Column(String(32), primary_key=True)
    user_id = Column(String(32), ForeignKey("users.id"))
    company = Column(String(160))
    city = Column(String(120))
    industry = Column(String(120))
    payment_terms_days = Column(Integer, default=7)
    advance_pct = Column(Integer, default=0)
    reliability_score = Column(Float, default=0.8)


class FPO(Base):
    __tablename__ = "fpos"
    id = Column(String(32), primary_key=True)
    user_id = Column(String(32), ForeignKey("users.id"))
    name = Column(String(160))
    district = Column(String(120))
    member_count = Column(Integer, default=0)


class Crop(Base):
    __tablename__ = "crops"
    id = Column(String(32), primary_key=True)
    name = Column(String(80))
    category = Column(String(80))
    season = Column(String(120))
    base_price_q = Column(Float)


class Market(Base):
    __tablename__ = "markets"
    id = Column(String(32), primary_key=True)
    name = Column(String(160))
    kind = Column(String(64))
    city = Column(String(120))
    district = Column(String(120))
    state = Column(String(64))
    lat = Column(Float)
    lng = Column(Float)
    distance_factor = Column(Float, default=1.0)


class MarketPrice(Base):
    __tablename__ = "market_prices"
    id = Column(String(32), primary_key=True)
    crop_id = Column(String(32), ForeignKey("crops.id"))
    market_id = Column(String(32), ForeignKey("markets.id"))
    price_per_q = Column(Float)
    change_pct = Column(Float)
    arrivals_qty = Column(Float)
    demand_index = Column(Float)
    record_date = Column(DateTime, default=_ts)
    series = Column(Text)


class BuyerRequirement(Base):
    __tablename__ = "buyer_requirements"
    id = Column(String(32), primary_key=True)
    buyer_id = Column(String(32), ForeignKey("buyers.id"))
    crop_id = Column(String(32), ForeignKey("crops.id"))
    grades = Column(String(32))
    min_qty_kg = Column(Float)
    max_qty_kg = Column(Float)
    price_per_kg = Column(Float)
    payment_terms_days = Column(Integer)
    advance_pct = Column(Integer, default=0)
    preferred_market = Column(String(120))
    active = Column(Boolean, default=True)


class Lot(Base):
    __tablename__ = "lots"
    id = Column(String(32), primary_key=True)
    fpo_id = Column(String(32), ForeignKey("fpos.id"))
    crop = Column(String(80))
    quantity_kg = Column(Float)
    quality = Column(String(16))
    grade = Column(String(32))
    location = Column(String(120))
    harvest_date = Column(DateTime)
    status = Column(
        Enum("created", "available", "offered", "negotiating", "order_confirmed",
             "in_transit", "delivered", "paid", "completed", "grievance",
             name="lot_status")
    )
    expected_price_per_kg = Column(Float)
    market = Column(String(120))
    created_at = Column(DateTime, default=_ts)


class Quality(Base):
    __tablename__ = "quality"
    id = Column(String(32), primary_key=True)
    lot_id = Column(String(32), ForeignKey("lots.id"))
    moisture_pct = Column(Float)
    size_grade = Column(String(32))
    blemishes_pct = Column(Float)
    inspection_by = Column(String(120))
    certificate = Column(String(120))


class Offer(Base):
    __tablename__ = "offers"
    id = Column(String(32), primary_key=True)
    lot_id = Column(String(32), ForeignKey("lots.id"))
    buyer_id = Column(String(32), ForeignKey("buyers.id"))
    price_per_kg = Column(Float)
    quantity_kg = Column(Float)
    delivery_days = Column(Integer)
    status = Column(Enum("pending", "accepted", "rejected", "countered", "expired", name="offer_status"))
    message = Column(Text)
    created_at = Column(DateTime, default=_ts)


class Negotiation(Base):
    __tablename__ = "negotiations"
    id = Column(String(32), primary_key=True)
    offer_id = Column(String(32), ForeignKey("offers.id"))
    side = Column(Enum("buyer", "seller", name="nego_side"))
    message = Column(Text)
    price_per_kg = Column(Float, nullable=True)
    created_at = Column(DateTime, default=_ts)


class Order(Base):
    __tablename__ = "orders"
    id = Column(String(32), primary_key=True)
    lot_id = Column(String(32), ForeignKey("lots.id"))
    offer_id = Column(String(32), ForeignKey("offers.id"))
    buyer_id = Column(String(32), ForeignKey("buyers.id"))
    amount = Column(Float)
    status = Column(Enum("confirmed", "in_transit", "delivered", "paid", "grievance", name="order_status"))
    note = Column(Text)
    created_at = Column(DateTime, default=_ts)


class Logistics(Base):
    __tablename__ = "logistics"
    id = Column(String(32), primary_key=True)
    order_id = Column(String(32), ForeignKey("orders.id"))
    carrier = Column(String(120))
    from_loc = Column(String(120))
    to_loc = Column(String(120))
    distance_km = Column(Float)
    cost = Column(Float)
    eta = Column(DateTime)
    status = Column(String(64))
    tracking = Column(Text)


class Payment(Base):
    __tablename__ = "payments"
    id = Column(String(32), primary_key=True)
    order_id = Column(String(32), ForeignKey("orders.id"))
    amount = Column(Float)
    status = Column(Enum("pending", "settled", "failed", name="pay_status"))
    method = Column(String(32))
    settled_at = Column(DateTime, nullable=True)


class Grievance(Base):
    __tablename__ = "grievances"
    id = Column(String(32), primary_key=True)
    order_id = Column(String(32), ForeignKey("orders.id"), nullable=True)
    lot_id = Column(String(32), ForeignKey("lots.id"), nullable=True)
    category = Column(Enum("payment", "quality", "logistics", "dispute", "other", name="gr_category"))
    description = Column(Text)
    status = Column(Enum("open", "review", "resolved", "escalated", name="gr_status"))
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_ts)