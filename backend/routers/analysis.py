from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

import crud
import schemas
from database import get_db, SessionLocal
import analysis as analysis_module

router = APIRouter()


def _run_with_own_session(analysis_id: int, symbol: str):
    """Wrapper so the background task gets its own DB session."""
    db = SessionLocal()
    try:
        analysis_module.run_analysis_task(analysis_id, symbol, db)
    finally:
        db.close()


@router.post("/run/{ticker_id}", response_model=schemas.AnalysisTriggerResponse)
def trigger_analysis(
    ticker_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    ticker = crud.get_ticker(db, ticker_id)
    if not ticker:
        raise HTTPException(status_code=404, detail="Ticker not found")

    running = crud.get_running_analysis(db, ticker_id)
    if running:
        raise HTTPException(
            status_code=409,
            detail=f"Analysis already {running.status} for {ticker.symbol}",
        )

    new_analysis = crud.create_analysis(db, ticker_id)
    background_tasks.add_task(_run_with_own_session, new_analysis.id, ticker.symbol)

    return schemas.AnalysisTriggerResponse(
        analysis_id=new_analysis.id, status=new_analysis.status
    )


@router.get("/{analysis_id}", response_model=schemas.AnalysisOut)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    a = crud.get_analysis(db, analysis_id)
    if not a:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return schemas.AnalysisOut.model_validate(a)


@router.get("/ticker/{ticker_id}", response_model=dict)
def list_ticker_analyses(
    ticker_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    ticker = crud.get_ticker(db, ticker_id)
    if not ticker:
        raise HTTPException(status_code=404, detail="Ticker not found")
    analyses, total = crud.get_ticker_analyses(db, ticker_id, limit=limit, offset=offset)
    return {
        "analyses": [schemas.AnalysisOut.model_validate(a).model_dump() for a in analyses],
        "total": total,
    }
