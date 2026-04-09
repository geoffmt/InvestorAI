from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Ticker(Base):
    __tablename__ = "tickers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=True)
    exchange = Column(String(50), nullable=True)
    currency = Column(String(10), default="USD")
    added_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    analyses = relationship("Analysis", back_populates="ticker", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker_id = Column(Integer, ForeignKey("tickers.id"), nullable=False)
    analysis_date = Column(Date, nullable=False)
    signal = Column(String(10), nullable=True)
    reasoning = Column(Text, nullable=True)
    raw_state = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(String(20), default="pending")
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticker = relationship("Ticker", back_populates="analyses")


class AppSettings(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, default=1)
    ollama_url = Column(String(500), default="http://localhost:11434")
    deep_thinking_model = Column(String(100), default="gemma4")
    quick_thinking_model = Column(String(100), default="gemma4")
    monthly_budget = Column(Float, default=1000.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
