"""
TradingAgents wrapper + allocation algorithm.
"""
import json
import logging
from datetime import datetime, date
from typing import Optional
from sqlalchemy.orm import Session

import crud
import models

logger = logging.getLogger(__name__)


# ── Signal parsing ─────────────────────────────────────────────────────────────

def parse_decision(decision) -> tuple[str, str, Optional[float]]:
    """Extract (signal, reasoning, confidence) from a TradingAgents decision."""
    if isinstance(decision, dict):
        action = str(decision.get("action", decision.get("decision", ""))).upper()
        reasoning = (
            decision.get("reasoning")
            or decision.get("rationale")
            or decision.get("explanation")
            or str(decision)
        )
        confidence = decision.get("confidence", None)
        if isinstance(confidence, str):
            try:
                confidence = float(confidence)
            except ValueError:
                confidence = None
    else:
        text = str(decision)
        action = ""
        for word in ["BUY", "SELL", "HOLD"]:
            if word in text.upper():
                action = word
                break
        reasoning = text
        confidence = None

    if action not in ("BUY", "SELL", "HOLD"):
        action = "HOLD"

    return action, reasoning, confidence


# ── TradingAgents runner ───────────────────────────────────────────────────────

def run_analysis_task(analysis_id: int, symbol: str, db: Session) -> None:
    """
    Background task: run TradingAgents analysis and persist result.
    This is called inside a FastAPI BackgroundTask with its own DB session.
    """
    crud.update_analysis(db, analysis_id, status="running", started_at=datetime.utcnow())

    try:
        settings = crud.get_settings(db)

        from tradingagents.graph.trading_graph import TradingAgentsGraph
        from tradingagents.default_config import DEFAULT_CONFIG

        config = DEFAULT_CONFIG.copy()
        config["provider"] = "ollama"
        config["deep_thinking_model"] = settings.deep_thinking_model
        config["quick_thinking_model"] = settings.quick_thinking_model
        config["backend_url"] = settings.ollama_url

        ta = TradingAgentsGraph(
            selected_analysts=["market", "social", "news", "fundamentals"],
            debug=False,
            config=config,
        )

        trade_date = date.today().isoformat()
        state_dict, decision = ta.propagate(symbol, trade_date)

        signal, reasoning, confidence = parse_decision(decision)

        raw_state_json = None
        try:
            raw_state_json = json.dumps(state_dict, default=str)
        except Exception:
            pass

        crud.update_analysis(
            db,
            analysis_id,
            status="completed",
            signal=signal,
            reasoning=reasoning,
            confidence=confidence,
            raw_state=raw_state_json,
            completed_at=datetime.utcnow(),
        )
        logger.info(f"Analysis {analysis_id} for {symbol} completed: {signal}")

    except Exception as exc:
        logger.exception(f"Analysis {analysis_id} for {symbol} failed")
        crud.update_analysis(
            db,
            analysis_id,
            status="failed",
            error_message=str(exc),
            completed_at=datetime.utcnow(),
        )


# ── Allocation algorithm ───────────────────────────────────────────────────────

_BASE_WEIGHTS = {"BUY": 3.0, "HOLD": 1.0}
_DEFAULT_CONFIDENCE = 0.7


def compute_allocation(db: Session) -> dict:
    """
    Build the monthly allocation proposal.
    Returns a dict matching schemas.AllocationProposal.
    """
    from datetime import datetime as dt

    settings = crud.get_settings(db)
    budget = settings.monthly_budget

    tickers = crud.get_tickers(db)

    allocations = []
    excluded = []
    unanalyzed = []

    for ticker in tickers:
        latest = crud.get_latest_analysis(db, ticker.id)

        if not latest:
            unanalyzed.append({
                "ticker_id": ticker.id,
                "symbol": ticker.symbol,
                "reason": "No completed analysis yet",
            })
            continue

        signal = latest.signal or "HOLD"

        if signal == "SELL":
            excluded.append({
                "ticker_id": ticker.id,
                "symbol": ticker.symbol,
                "reason": "SELL signal",
            })
            continue

        base = _BASE_WEIGHTS.get(signal, 1.0)
        conf = latest.confidence if latest.confidence is not None else _DEFAULT_CONFIDENCE
        adjusted = base * (0.5 + 0.5 * conf)

        allocations.append({
            "ticker_id": ticker.id,
            "symbol": ticker.symbol,
            "signal": signal,
            "_adjusted": adjusted,
            "reasoning_summary": (latest.reasoning or "")[:200] if latest.reasoning else None,
        })

    # Normalize and compute EUR amounts
    total_weight = sum(a["_adjusted"] for a in allocations)
    result_allocations = []

    if total_weight > 0:
        amounts = []
        for a in allocations:
            weight = a["_adjusted"] / total_weight
            amount = round(weight * budget, 2)
            amounts.append(amount)

        # Fix rounding remainder
        remainder = round(budget - sum(amounts), 2)
        if amounts and remainder != 0:
            max_idx = amounts.index(max(amounts))
            amounts[max_idx] = round(amounts[max_idx] + remainder, 2)

        for a, amount in zip(allocations, amounts):
            result_allocations.append({
                "ticker_id": a["ticker_id"],
                "symbol": a["symbol"],
                "signal": a["signal"],
                "weight": round(a["_adjusted"] / total_weight, 4),
                "amount_eur": amount,
                "reasoning_summary": a["reasoning_summary"],
            })

    return {
        "total_budget": budget,
        "currency": "EUR",
        "generated_at": dt.utcnow(),
        "allocations": result_allocations,
        "excluded": excluded,
        "unanalyzed": unanalyzed,
    }
