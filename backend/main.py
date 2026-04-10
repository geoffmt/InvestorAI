from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes (must be registered before the SPA catch-all) ─────────────────
app.include_router(tickers.router,    prefix="/api/v1/tickers",    tags=["tickers"])
app.include_router(analysis.router,   prefix="/api/v1/analysis",   tags=["analysis"])
app.include_router(allocation.router, prefix="/api/v1/allocation",  tags=["allocation"])
app.include_router(settings.router,   prefix="/api/v1/settings",   tags=["settings"])

# ── Serve React SPA from frontend/dist (production build) ────────────────────
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Serve hashed static assets (JS/CSS bundles)
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Return index.html for all non-API routes so React Router works."""
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "InvestorAI API — build the frontend first",
            "docs": "/docs",
            "hint": "cd frontend && npm run build",
        }
