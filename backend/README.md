# KRISHISETU AI — Backend

Python + FastAPI prototype for SIH 2026 (PS SIH26132). Serves simulated,
clearly-labelled demo data so it runs with zero setup. Architecture is
Postgres-ready (see `app/models.py` and `docs/ARCHITECTURE.md`).

## Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Docs (auto-generated): http://localhost:8000/docs

Optional ML stack: `pip install pandas numpy scikit-learn xgboost`. Without it the
AI service uses a pure-Python fallback — the API contracts are identical.

## API

All endpoints return `"source": "simulated"` markers. See `app/routers/`.