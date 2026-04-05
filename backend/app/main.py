from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.katalog import router as katalog_router

app = FastAPI(title="Declaro API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(katalog_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "declaro-backend"}
