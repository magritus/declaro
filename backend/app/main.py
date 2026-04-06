from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.auth import router as auth_router
from app.api.calisma import kalem_router, router as calisma_router
from app.api.donem import donem_tekil_router, router as donem_router
from app.api.export import router as export_router
from app.api.hesaplama import router as hesaplama_router
from app.api.katalog import router as katalog_router
from app.api.mukellef import router as mukellef_router
from app.config import settings
from app.logging_config import setup_logging
from app.middleware.security_headers import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    yield


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Declaro API",
    version="0.1.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(katalog_router)
app.include_router(mukellef_router)
app.include_router(donem_router)
app.include_router(donem_tekil_router)
app.include_router(calisma_router)
app.include_router(kalem_router)
app.include_router(hesaplama_router)
app.include_router(export_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "declaro-backend"}
