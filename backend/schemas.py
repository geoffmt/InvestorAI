from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, field_validator


# ── Ticker ────────────────────────────────────────────────────────────────────

class TickerCreate(BaseModel):
    symbol: str
    name: Optional[str] = None
    exchange: Optional[str] = None
    currency: str = "USD"

    @field_validator("symbol")
    @classmethod
    def symbol_upper(cls, v: str) -> str:
        return v.strip().upper()


class TickerSummary(BaseModel):
    id: int
    symbol: str
    name: Optional[str]
    exchange: Optional[str]
    currency: str
    added_at: datetime
    is_active: bool
    latest_signal: Optional[str] = None
    latest_analysis_date: Optional[date] = None
    analysis_status: Optional[str] = None

    model_config = {"from_attributes": True}


class TickerDetail(TickerSummary):
    recent_analyses: List["AnalysisOut"] = []


# ── Analysis ──────────────────────────────────────────────────────────────────

class AnalysisOut(BaseModel):
    id: int
    ticker_id: int
    analysis_date: date
    signal: Optional[str]
    reasoning: Optional[str]
    confidence: Optional[float]
    status: str
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisTriggerResponse(BaseModel):
    analysis_id: int
    status: str


# ── Allocation ────────────────────────────────────────────────────────────────

class AllocationItem(BaseModel):
    ticker_id: int
    symbol: str
    signal: str
    weight: float
    amount_eur: float
    reasoning_summary: Optional[str]


class ExcludedItem(BaseModel):
    ticker_id: int
    symbol: str
    reason: str


class AllocationProposal(BaseModel):
    total_budget: float
    currency: str = "EUR"
    generated_at: datetime
    allocations: List[AllocationItem]
    excluded: List[ExcludedItem]
    unanalyzed: List[ExcludedItem]


# ── Settings ──────────────────────────────────────────────────────────────────

class AppSettingsOut(BaseModel):
    ollama_url: str
    deep_thinking_model: str
    quick_thinking_model: str
    monthly_budget: float
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class AppSettingsUpdate(BaseModel):
    ollama_url: Optional[str] = None
    deep_thinking_model: Optional[str] = None
    quick_thinking_model: Optional[str] = None
    monthly_budget: Optional[float] = None


class OllamaTestResult(BaseModel):
    connected: bool
    models: List[str] = []
    error: Optional[str] = None


# Forward ref resolution
TickerDetail.model_rebuild()
