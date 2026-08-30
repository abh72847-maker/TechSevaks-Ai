"""Mock data store.

Serves seeded demo records and supports stateful mutations (create lot, offer,
order...) for the running server. In production this module is replaced by a
SQLAlchemy/PostgreSQL repository exposing the same read/write contract.
"""

from __future__ import annotations

import copy
import threading
from datetime import datetime, timezone
from typing import Any

from app import seed

_PREFIX = {"lot": "KSL-", "offer": "OOF-", "order": "ORD-", "logistics": "LOG-",
           "payment": "PAY-", "grievance": "GRV-", "negotiation": "NEG-", "transaction": "TXN-"}


class MockDataStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.data: dict[str, list[dict]] = copy.deepcopy(seed.SEED)

    # ---------------------------------------------------------------- reads
    def get(self, key: str, **filters) -> list[dict]:
        with self._lock:
            rows = copy.deepcopy(self.data.get(key, []))
        for k, v in filters.items():
            rows = [r for r in rows if r.get(k) == v]
        return rows

    def find(self, key: str, id: str) -> dict | None:
        for r in self.get(key):
            if r.get("id") == id:
                return r
        return None

    def latest_series(self, crop: str, market: str, days: int = 30):
        for row in self.get("market_prices", crop=crop):
            if row["market"] == market:
                return row["series"][-days:]
        return []

    # ---------------------------------------------------------------- writes
    def _next_id(self, key: str, k: str = "id") -> str:
        existing = [r.get(k, "") for r in self.data.get(key, [])]
        nums = []
        prefix = _PREFIX.get(key.rstrip("s"), "")
        for e in existing:
            try:
                nums.append(int(str(e).replace(prefix, "")))
            except ValueError:
                continue
        return f"{prefix}{max(nums, default=1000) + 1}"

    def insert(self, key: str, row: dict) -> dict:
        with self._lock:
            row = copy.deepcopy(row)
            if "id" not in row:
                row["id"] = self._next_id(key)
            if "created_at" not in row:
                row["created_at"] = datetime.now(timezone.utc).isoformat()
            self.data.setdefault(key, []).append(row)
            return copy.deepcopy(row)

    def update(self, key: str, id: str, patch: dict, where: dict | None = None) -> dict | None:
        with self._lock:
            for r in self.data.get(key, []):
                if r.get("id") == id and all(r.get(k) == v for k, v in (where or {}).items()):
                    r.update(copy.deepcopy(patch))
                    return copy.deepcopy(r)
        return None

    def delete(self, key: str, id: str) -> bool:
        with self._lock:
            before = len(self.data.get(key, []))
            self.data[key] = [r for r in self.data.get(key, []) if r.get("id") != id]
            return len(self.data[key]) < before

    def stats(self) -> dict:
        with self._lock:
            return {k: len(v) for k, v in self.data.items()}


store = MockDataStore()