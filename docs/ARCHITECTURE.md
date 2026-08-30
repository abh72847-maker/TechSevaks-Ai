# KRISHISETU AI — Architecture

**SIH 2026 · Problem Statement SIH26132**
*Strengthening Market Linkages and Price Discovery for Farmers.*

**USP**
> Helping farmers decide **WHEN** to sell, **WHERE** to sell, and **WHO** to sell to,
> based on expected **Net Realisation**.

---

## 1. System Overview

```
┌─────────────────────────────┐    HTTP / JSON    ┌──────────────────────────────┐
│  Frontend (React + Vite)    │ ────────────────► │  Backend (Python + FastAPI)  │
│  Tailwind · Recharts ·      │                   │  AI Services (Pandas/NumPy/  │
│  Lucide · Leaflet/OSM       │ ◄──────────────── │  Scikit-learn, with pure-    │
└─────────────────────────────┘   + CORS          │  Python fallback for demo)   │
                                                 └──────────────┬───────────────┘
                                                                ▼
                                            ┌────────────────────────────────┐
                                            │ Mock data store (demo)         │
                                            │ ── target ──► PostgreSQL via   │
                                            │ SQLAlchemy models (models.py)  │
                                            └────────────────────────────────┘
```

The prototype runs **fully offline** on seeded, realistic Indian agriculture demo
data (₹/INR). All responses carry a `"source": "simulated"` / `note` flag so demo
data is never mistaken for real market data. The data layer is isolated behind a
thin store interface so a real PostgreSQL + live mandi feed can be swapped in
without touching routers or the UI.

## 2. Repository Layout

```
TechSevaks/
├── docs/
│   └── ARCHITECTURE.md          # this file
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # FastAPI app, CORS, router registration
│       ├── config.py            # settings (API prefix, demo mode, DB URL)
│       ├── database.py          # MockDataStore + PostgreSQL swap point
│       ├── models.py            # SQLAlchemy target schema (Postgres-ready)
│       ├── schemas.py           # Pydantic request/response models
│       ├── seed.py              # realistic demo datasets (INR)
│       ├── services/
│       │   └── ai.py            # the 6 AI functions
│       └── routers/
│           ├── market.py        # /market-prices /market-trends
│           ├── forecast.py      # /price-forecast
│           ├── realisation.py   # /net-realisation
│           ├── recommendation.py# /recommendation
│           ├── buyers.py        # /buyer-match /buyers
│           ├── fpo.py           # /fpo/aggregate /fpo/dashboard
│           ├── lots.py          # /lots
│           ├── offers.py        # /offers /negotiations
│           ├── orders.py        # /orders /payments
│           ├── logistics.py     # /logistics
│           └── grievances.py    # /grievances
└── frontend/
    ├── vite.config.js           # dev proxy → :8000/api
    ├── tailwind.config.js
    └── src/
        ├── main.tsx / App.tsx   # router
        ├── api/
        │   ├── client.ts        # typed fetch client
        │   └── fallback.ts      # offline demo engine (same contracts)
        ├── context/AppContext.tsx
        ├── components/          # shared layout, cards, charts, badges
        └── pages/               # 11 screens
```

## 3. Main Flow (demo journey)

```
Farmer → Market Intelligence → Net Realisation → AI Decision (WHEN/WHERE/WHO)
→ FPO Aggregation → Quality → Digital Lot → Buyer Matching → Offer → Negotiation
→ Logistics → Delivery → Payment → Grievance → Transparent Transaction
```

The **Transaction Flow** page runs this end-to-end with a stepper that calls each
backend endpoint in sequence and displays the resulting record.

## 4. AI Functions (backend/app/services/ai.py)

| Function | Purpose |
|---|---|
| `get_market_intelligence()` | Current prices, arrivals, demand per market |
| `forecast_price()` | N-day price forecast (trend + seasonality; sklearn if installed, linear fallback) |
| `calculate_net_realisation()` | Revenue − transport − storage − handling − expected loss |
| `match_buyers()` | Score buyers: price, distance, qty, quality, payment terms, reliability |
| `aggregate_farmers()` | Group compatible farmers → bulk digital lot |
| `generate_recommendation()` | WHEN / WHERE / WHO with reasons, scores, confidence |

Confidence is a **heuristic** (data coverage × volatility × factor agreement) and
every payload is labelled *simulated*. No claim is made about real-world accuracy.

## 5. API Surface (all under `/api`)

```
GET  /market-prices          POST /price-forecast
GET  /market-trends          POST /net-realisation
POST /recommendation         POST /buyer-match
POST /fpo/aggregate          POST /lots
GET  /lots                   POST /offers
POST /negotiations           POST /orders
GET  /logistics              POST /grievances
POST /payments/settle        GET  /payments
GET  /farmers  /buyers  /fpos  /crops  /markets   GET /admin/summary
```

## 6. PostgreSQL Target Schema (models.py)

`Users · Farmers · Buyers · FPOs · Crops · Markets · MarketPrices ·
BuyerRequirements · Lots · Quality · Offers · Negotiations · Orders ·
Logistics · Payments · Grievances`

Run `models.py` with SQLAlchemy 2.0 against PostgreSQL in production; in demo mode
the identical structures are served from the seeded in-memory store.

## 7. Switching Mock → Real

1. Set `DATABASE_URL` in `backend/app/config.py`.
2. Implement `MarketDataProvider` backed by AMA/AGMARKNET/eNAM feeds.
3. Keep the AI function signatures identical — the contract does not change.
4. Frontend already works through `/api` with a dev proxy; no UI change needed.