# KRISHISETU AI — SIH 2026 Prototype

**Problem Statement (PS-SIH26132):** Strengthening Market Linkages and Price Discovery for Farmers.

A functional full-stack prototype answering the farmers' three hardest questions — **WHEN to sell, WHERE to sell, WHO to sell to** — driven by expected **Net Realisation** (the money that actually reaches the farmer after transport, storage, handling and losses).

> Built for a Smart India Hackathon (SIH) 2026 demo. All market/farmer/buyer numbers are **simulated demo data** and clearly labelled as such in the UI.

## The core idea (the "one-liner")

> Gross price is an illusion. Net Realisation is the truth. KrishiSetu tells a farmer which market nets the most, when to sell, and which verified buyer pays best — then carries the whole transaction end-to-end: **digital lot → offers → negotiation → binding order → logistics → payment → dispute support**.

## Personas (demo)

| Role | Who | Where they sit |
| --- | --- | --- |
| Farmer | Ramesh Patil, Wadivihir, Nashik (4.2 acres, KCC ₹2.5L) | `/app/farmer` |
| Buyer | Star Agri Exports, Nashik (ai-matched 97.5, ₹19.4/kg, 50% advance) | `/app/buyer` |
| FPO | Nashik Tomato Growers FPO (212 members) | `/app/fpo` |
| Regulator/Ops | Platform admin console | `/app/admin` |

AI "decision engine" for the default demo scenario **Tomato · 1000 kg · Grade A · Nashik · sell within 3 days**:
- **WHEN** → Sell Now (score 0.82)
- **WHERE** → Pimpalgaon APMC, net **₹18.41/kg** (beats Vashi despite Vashi's higher gross — transport decides)
- **WHO** → Star Agri Exports (match 97.5)
- Confidence **0.87** (heuristic — shown with a honesty banner)

## Stack

- **Frontend** (`frontend/`): React 18 + Vite + TypeScript (strict) + Tailwind + Recharts + Lucide + Leaflet
- **Backend** (`backend/`): FastAPI, Pydantic v2, SQLAlchemy models (PostgreSQL target) running on a seeded **in-memory demo store**
- **AI layer** (`backend/app/services/ai.py`): pure-Python heuristics (linear-trend forecast, transport-cost net model, weighted buyer matching, FPO aggregation, 3-window recommendation). Deterministic → demos reproducibly.

## Run it

Backend (port 8000):

```bash
cd backend
python -m venv .venv                  # or reuse repo-root venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend (port 5173):

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — Vite proxies `/api` → `http://localhost:8000`.

> **Offline mode:** if the backend is not running, the frontend automatically falls back to a bundled demo engine (`frontend/src/api/fallback.ts`) that mirrors the backend responses 1:1, so the demo always works. If you call the API client directly (e.g. `python -c`), note `fastapi.testclient` needs `httpx`; we smoke-test via live `Invoke-RestMethod` instead.

## Suggested demo path (founder pitch)

1. **Landing** (`/`) — the problem + the 3-decision engine.
2. **Farmer dashboard** (`/app/farmer`) — edit the scenario, see WHEN/WHERE/WHO live.
3. **Net Realisation** (`/app/realisation`) — the gross-vs-net waterfall and ranked market table (the USP).
4. **Market intelligence** (`/app/market`) — live mandi prices, 30-day trends, forecast band, Leaflet market map.
5. **FPO aggregation** (`/app/fpo`) — checkbox 12 farmers → one bulk digital lot + pre-matched buyers.
6. **Transaction flow** (`/app/flow`) — click buttons to drive lot → offer → negotiation → order → logistics → payment → dispute live.
7. **Buyer workspace** (`/app/buyer`) and **Admin console** (`/app/admin`) — the counterpart views.

## Repo layout

```
backend/
  app/
    main.py            # FastAPI app + routers
    models.py          # SQLAlchemy target schema (Postgres-ready)
    database.py        # seeded in-memory MockDataStore
    seed.py            # deterministic demo datasets (INR)
    schemas.py         # Pydantic request/response models
    services/ai.py     # the AI decision engines
    routers/           # /market, /forecast, /realisation, /recommendation,
                       # /buyers, /fpo, /lots, /offers, /orders, /logistics,
                       # /grievances, /admin
  requirements.txt
frontend/
  src/
    api/               # live client + bundled offline fallback
    context/           # persona + toast store
    hooks/useFetch.ts
    components/        # charts, Badge, StatCard, Modals, Layout…
    pages/             # one page per persona/market/flow
    types.ts           # TS mirror of the API contract
docs/ARCHITECTURE.md   # deeper design notes
```

## Notes for jury / judges

- The demo is **deterministic**: same scenario → same answer, every time.
- Every AI number carries a **confidence / heuristic disclaimer** — a deliberate honesty cue.
- The transport model is tuned (`2.0 + 1.05·km ₹/qtl`) so the *closest* market wins on net — the exact point the problem statement cares about.
- Swap the mock store for PostgreSQL (see `models.py`) without touching the API contract.