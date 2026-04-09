from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine
import models
import crud
from database import SessionLocal
from routers import tickers, analysis, allocation, settings

# Create tables
models.Base.metadata.create_all(bind=engine)

# On startup: seed settings singleton + reset stuck analyses
def _startup():
    db = SessionLocal()
    try:
        crud.get_settings(db)           # creates row if missing
        stuck = crud.reset_stuck_analyses(db)
        if stuck:
            print(f"[startup] Reset {stuck} stuck analysis row(s) to 'failed'")
    finally:
        db.close()

_startup()

app = FastAPI(title="InvestorAI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickers.router,    prefix="/api/v1/tickers",    tags=["tickers"])
app.include_router(analysis.router,   prefix="/api/v1/analysis",   tags=["analysis"])
app.include_router(allocation.router, prefix="/api/v1/allocation",  tags=["allocation"])
app.include_router(settings.router,   prefix="/api/v1/settings",   tags=["settings"])


@app.get("/")
def root():
    return {"message": "InvestorAI API", "docs": "/docs"}
