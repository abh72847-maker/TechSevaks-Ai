from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (admin, buyers, forecast, fpo, grievances, logistics,
                         lots, market, offers, orders, realisation,
                         recommendation)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Market linkages & price discovery for farmers — SIH 2026 (PS SIH26132). "
                "Prototype serves simulated, clearly-labelled demo data.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_API = settings.API_PREFIX
app.include_router(market.router, prefix=_API)
app.include_router(forecast.router, prefix=_API)
app.include_router(realisation.router, prefix=_API)
app.include_router(recommendation.router, prefix=_API)
app.include_router(buyers.router, prefix=_API)
app.include_router(fpo.router, prefix=_API)
app.include_router(lots.router, prefix=_API)
app.include_router(offers.router, prefix=_API)
app.include_router(orders.router, prefix=_API)
app.include_router(logistics.router, prefix=_API)
app.include_router(grievances.router, prefix=_API)
app.include_router(admin.router, prefix=_API)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "ps": "SIH26132 — Strengthening Market Linkages and Price Discovery for Farmers",
        "docs": "/docs",
        "endpoints": sorted({f"{sorted(route.methods)[0]} {route.path}"
                             for route in app.routes if hasattr(route, "methods")}),
        "mode": settings.DATA_MODE,
        "status": "Simulated demo — no live market claims.",
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return exc