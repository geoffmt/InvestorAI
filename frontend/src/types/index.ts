export type Signal = "BUY" | "SELL" | "HOLD";
export type AnalysisStatus = "pending" | "running" | "completed" | "failed";

export interface Ticker {
  id: number;
  symbol: string;
  name: string | null;
  exchange: string | null;
  currency: string;
  added_at: string;
  is_active: boolean;
  latest_signal: Signal | null;
  latest_analysis_date: string | null;
  analysis_status: AnalysisStatus | null;
}

export interface Analysis {
  id: number;
  ticker_id: number;
  analysis_date: string;
  signal: Signal | null;
  reasoning: string | null;
  confidence: number | null;
  status: AnalysisStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AllocationItem {
  ticker_id: number;
  symbol: string;
  signal: Signal;
  weight: number;
  amount_eur: number;
  reasoning_summary: string | null;
}

export interface ExcludedItem {
  ticker_id: number;
  symbol: string;
  reason: string;
}

export interface AllocationProposal {
  total_budget: number;
  currency: string;
  generated_at: string;
  allocations: AllocationItem[];
  excluded: ExcludedItem[];
  unanalyzed: ExcludedItem[];
}

export interface AppSettings {
  ollama_url: string;
  deep_thinking_model: string;
  quick_thinking_model: string;
  monthly_budget: number;
  updated_at: string | null;
}

export interface OllamaTestResult {
  connected: boolean;
  models: string[];
  error: string | null;
}
