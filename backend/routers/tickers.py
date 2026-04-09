from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud
import schemas
from database import get_db

router = APIRouter()


@router.get("", response_model=dict)
def list_tickers(db: Session = Depends(get_db)):
    tickers = crud.get_tickers(db)
    summaries = [crud.get_ticker_summary(db, t) for t in tickers]
    return {"tickers": [s.model_dump() for s in summaries]}


@router.post("", response_model=schemas.TickerSummary, status_code=201)
def add_ticker(data: schemas.TickerCreate, db: Session = Depends(get_db)):
    existing = crud.get_ticker_by_symbol(db, data.symbol)
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=409, detail=f"Ticker {data.symbol} already exists")
        # Reactivate soft-deleted ticker
        existing.is_active = True
        existing.name = data.name or existing.name
        existing.exchange = data.exchange or existing.exchange
        existing.currency = data.currency
        db.commit()
        db.refresh(existing)
        return crud.get_ticker_summary(db, existing)
    ticker = crud.create_ticker(db, data)
    return crud.get_ticker_summary(db, ticker)


@router.get("/{ticker_id}", response_model=schemas.TickerDetail)
def get_ticker(ticker_id: int, db: Session = Depends(get_db)):
    ticker = crud.get_ticker(db, ticker_id)
    if not ticker:
        raise HTTPException(status_code=404, detail="Ticker not found")
    summary = crud.get_ticker_summary(db, ticker)
    analyses, _ = crud.get_ticker_analyses(db, ticker_id, limit=10)
    return schemas.TickerDetail(
        **summary.model_dump(),
        recent_analyses=[schemas.AnalysisOut.model_validate(a) for a in analyses],
    )


@router.delete("/{ticker_id}")
def delete_ticker(ticker_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_ticker(db, ticker_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Ticker not found")
    return {"message": "ok"}
