from datetime import datetime, date
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
import models
import schemas


# ── Tickers ───────────────────────────────────────────────────────────────────

def get_tickers(db: Session) -> List[models.Ticker]:
    return db.query(models.Ticker).filter(models.Ticker.is_active == True).all()


def get_ticker(db: Session, ticker_id: int) -> Optional[models.Ticker]:
    return db.query(models.Ticker).filter(
        models.Ticker.id == ticker_id,
        models.Ticker.is_active == True,
    ).first()


def get_ticker_by_symbol(db: Session, symbol: str) -> Optional[models.Ticker]:
    return db.query(models.Ticker).filter(models.Ticker.symbol == symbol).first()


def create_ticker(db: Session, data: schemas.TickerCreate) -> models.Ticker:
    ticker = models.Ticker(**data.model_dump())
    db.add(ticker)
    db.commit()
    db.refresh(ticker)
    return ticker


def delete_ticker(db: Session, ticker_id: int) -> bool:
    ticker = get_ticker(db, ticker_id)
    if not ticker:
        return False
    ticker.is_active = False
    db.commit()
    return True


def get_latest_analysis(db: Session, ticker_id: int) -> Optional[models.Analysis]:
    return db.query(models.Analysis).filter(
        models.Analysis.ticker_id == ticker_id,
        models.Analysis.status == "completed",
    ).order_by(desc(models.Analysis.analysis_date)).first()


def get_running_analysis(db: Session, ticker_id: int) -> Optional[models.Analysis]:
    return db.query(models.Analysis).filter(
        models.Analysis.ticker_id == ticker_id,
        models.Analysis.status.in_(["pending", "running"]),
    ).first()


def get_ticker_summary(db: Session, ticker: models.Ticker) -> schemas.TickerSummary:
    latest = get_latest_analysis(db, ticker.id)
    running = get_running_analysis(db, ticker.id)

    status = None
    if running:
        status = running.status
    elif latest:
        status = "completed"

    return schemas.TickerSummary(
        id=ticker.id,
        symbol=ticker.symbol,
        name=ticker.name,
        exchange=ticker.exchange,
        currency=ticker.currency,
        added_at=ticker.added_at,
        is_active=ticker.is_active,
        latest_signal=latest.signal if latest else None,
        latest_analysis_date=latest.analysis_date if latest else None,
        analysis_status=status,
    )


# ── Analyses ──────────────────────────────────────────────────────────────────

def create_analysis(db: Session, ticker_id: int) -> models.Analysis:
    analysis = models.Analysis(
        ticker_id=ticker_id,
        analysis_date=date.today(),
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def get_analysis(db: Session, analysis_id: int) -> Optional[models.Analysis]:
    return db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()


def get_ticker_analyses(
    db: Session, ticker_id: int, limit: int = 20, offset: int = 0
) -> tuple[List[models.Analysis], int]:
    q = db.query(models.Analysis).filter(models.Analysis.ticker_id == ticker_id)
    total = q.count()
    analyses = q.order_by(desc(models.Analysis.created_at)).offset(offset).limit(limit).all()
    return analyses, total


def update_analysis(db: Session, analysis_id: int, **kwargs) -> Optional[models.Analysis]:
    analysis = get_analysis(db, analysis_id)
    if not analysis:
        return None
    for key, value in kwargs.items():
        setattr(analysis, key, value)
    db.commit()
    db.refresh(analysis)
    return analysis


def reset_stuck_analyses(db: Session) -> int:
    stuck = db.query(models.Analysis).filter(
        models.Analysis.status.in_(["running", "pending"])
    ).all()
    for a in stuck:
        a.status = "failed"
        a.error_message = "Server restarted during analysis"
    db.commit()
    return len(stuck)


# ── Settings ──────────────────────────────────────────────────────────────────

def get_settings(db: Session) -> models.AppSettings:
    settings = db.query(models.AppSettings).filter(models.AppSettings.id == 1).first()
    if not settings:
        settings = models.AppSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_settings(db: Session, data: schemas.AppSettingsUpdate) -> models.AppSettings:
    settings = get_settings(db)
    updates = data.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(settings, key, value)
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return settings
