from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
    APP_NAME: str = "KRISHISETU AI"
    API_PREFIX: str = "/api"
    VERSION: str = "0.1.0-demo"
    CORS_ORIGINS: tuple = ("http://localhost:5173", "http://127.0.0.1:5173")

    # Demo mode serves seeded, simulated data from the in-memory store.
    DATA_MODE: str = "mock"

    # Production: point to PostgreSQL and implement a live market provider.
    DATABASE_URL: str = "postgresql+psycopg2://krishisetu:krishisetu@localhost:5432/krishisetu"
    LIVE_MARKET_BASE_URL: str = ""


settings = Settings()