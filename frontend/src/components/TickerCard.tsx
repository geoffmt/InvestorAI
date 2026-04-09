import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { triggerAnalysis, fetchAnalysis, deleteTicker } from "../api/client";
import SignalBadge from "./SignalBadge";
import type { Ticker, Analysis } from "../types";

interface Props {
  ticker: Ticker;
}

export default function TickerCard({ ticker }: Props) {
  const queryClient = useQueryClient();
  const [runningAnalysisId, setRunningAnalysisId] = useState<number | null>(null);

  // Poll the running analysis until it finishes
  const { data: polledAnalysis } = useQuery<Analysis>({
    queryKey: ["analysis", runningAnalysisId],
    queryFn: () => fetchAnalysis(runningAnalysisId!),
    enabled: runningAnalysisId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") {
        queryClient.invalidateQueries({ queryKey: ["tickers"] });
        setRunningAnalysisId(null);
        return false;
      }
      return 5000;
    },
  });

  const runMutation = useMutation({
    mutationFn: () => triggerAnalysis(ticker.id),
    onSuccess: (data) => setRunningAnalysisId(data.analysis_id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTicker(ticker.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickers"] }),
  });

  const isRunning =
    runningAnalysisId !== null ||
    ticker.analysis_status === "pending" ||
    ticker.analysis_status === "running";

  const currentStatus = polledAnalysis?.status ?? ticker.analysis_status;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <Link
            to={`/ticker/${ticker.id}`}
            className="text-lg font-bold text-white hover:text-indigo-400 transition-colors"
          >
            {ticker.symbol}
          </Link>
          {ticker.name && (
            <p className="text-xs text-gray-500 mt-0.5">{ticker.name}</p>
          )}
          {ticker.exchange && (
            <p className="text-xs text-gray-600">{ticker.exchange}</p>
          )}
        </div>
        <SignalBadge signal={ticker.latest_signal} />
      </div>

      {ticker.latest_analysis_date && (
        <p className="text-xs text-gray-600">
          Last analysed: {ticker.latest_analysis_date}
        </p>
      )}

      {isRunning && (
        <div className="flex items-center gap-2 text-xs text-indigo-400">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          {currentStatus === "running" ? "Analysing…" : "Queued…"}
        </div>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={() => runMutation.mutate()}
          disabled={isRunning || runMutation.isPending}
          className="flex-1 text-sm px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Run Analysis
        </button>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-red-900 hover:text-red-300 disabled:opacity-40 transition-colors text-gray-400"
          title="Remove ticker"
        >
          ✕
        </button>
      </div>

      {runMutation.isError && (
        <p className="text-xs text-red-400">
          {(runMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "Failed to trigger analysis"}
        </p>
      )}
    </div>
  );
}
