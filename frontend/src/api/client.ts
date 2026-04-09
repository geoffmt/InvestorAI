import axios from "axios";
import type {
  Ticker,
  Analysis,
  AllocationProposal,
  AppSettings,
  OllamaTestResult,
} from "../types";

const api = axios.create({ baseURL: "/api/v1" });

// ── Tickers ──────────────────────────────────────────────────────────────────

export async function fetchTickers(): Promise<Ticker[]> {
  const { data } = await api.get<{ tickers: Ticker[] }>("/tickers");
  return data.tickers;
}

export async function addTicker(payload: {
  symbol: string;
  name?: string;
  exchange?: string;
  currency?: string;
}): Promise<Ticker> {
  const { data } = await api.post<Ticker>("/tickers", payload);
  return data;
}

export async function fetchTicker(id: number): Promise<Ticker & { recent_analyses: Analysis[] }> {
  const { data } = await api.get(`/tickers/${id}`);
  return data;
}

export async function deleteTicker(id: number): Promise<void> {
  await api.delete(`/tickers/${id}`);
}

// ── Analysis ─────────────────────────────────────────────────────────────────

export async function triggerAnalysis(
  tickerId: number
): Promise<{ analysis_id: number; status: string }> {
  const { data } = await api.post(`/analysis/run/${tickerId}`);
  return data;
}

export async function fetchAnalysis(analysisId: number): Promise<Analysis> {
  const { data } = await api.get<Analysis>(`/analysis/${analysisId}`);
  return data;
}

export async function fetchTickerAnalyses(
  tickerId: number,
  limit = 20,
  offset = 0
): Promise<{ analyses: Analysis[]; total: number }> {
  const { data } = await api.get(`/analysis/ticker/${tickerId}`, {
    params: { limit, offset },
  });
  return data;
}

// ── Allocation ────────────────────────────────────────────────────────────────

export async function fetchAllocationProposal(): Promise<AllocationProposal> {
  const { data } = await api.get<AllocationProposal>("/allocation/proposal");
  return data;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function fetchSettings(): Promise<AppSettings> {
  const { data } = await api.get<AppSettings>("/settings");
  return data;
}

export async function updateSettings(
  payload: Partial<AppSettings>
): Promise<AppSettings> {
  const { data } = await api.put<AppSettings>("/settings", payload);
  return data;
}

export async function testOllamaConnection(): Promise<OllamaTestResult> {
  const { data } = await api.post<OllamaTestResult>("/settings/test-connection");
  return data;
}
