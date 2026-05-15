"""
middleware/face_concurrency.py

Limits how many face ML requests can run at the same time across the
entire teacher service process. This is a second layer of protection
after nginx rate limiting — it prevents a burst of concurrent requests
(e.g. from multiple teachers at once) from saturating the face worker.

Usage in main.py:
    from middleware.face_concurrency import FaceConcurrencyMiddleware
    app.add_middleware(FaceConcurrencyMiddleware, max_concurrent=3)
"""

import asyncio
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Endpoints that fan out to face:8004 and are CPU-heavy
FACE_PATHS = {
    "/teacher/attendance/train-student",
    "/teacher/attendance/run-training",
    "/teacher/attendance/recognize",
}

# Maximum simultaneous in-flight requests across ALL those endpoints.
# Set to the number of CPU cores on the face container (typically 1-4).
MAX_CONCURRENT = 3


class FaceConcurrencyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_concurrent: int = MAX_CONCURRENT):
        super().__init__(app)
        self._sem = asyncio.Semaphore(max_concurrent)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path not in FACE_PATHS:
            return await call_next(request)

        # Non-blocking acquire — if all slots taken, return 503 immediately
        # rather than queuing the request (which would just delay the DOS).
        acquired = self._sem._value > 0
        if not acquired:
            return JSONResponse(
                status_code=503,
                content={
                    "detail": (
                        "Face processing at capacity. "
                        "Please wait a moment and try again."
                    )
                },
            )

        async with self._sem:
            return await call_next(request)