import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTicker, fetchTickerAnalyses } from "../api/client";
import SignalBadge from "../components/SignalBadge";
import SignalHistoryChart from "../components/SignalHistoryChart";
import type { Signal } from "../types";

export default function TickerDetail() {
  const { id } = useParams<{ id: string }>();
  const tickerId = Number(id);

  const { data: ticker, isLoading: tickerLoading } = useQuery({
    queryKey: ["ticker", tickerId],
    queryFn: () => fetchTicker(tickerId),
    enabled: !isNaN(tickerId),
  });

  const { data: analysesData, isLoading: analysesLoading } = useQuery({
    queryKey: ["tickerAnalyses", tickerId],
    queryFn: () => fetchTickerAnalyses(tickerId, 20, 0),
    enabled: !isNaN(tickerId),
  });

  if (tickerLoading || analysesLoading) {
    return <div className="p-8 text-gray-500 text-sm">Loading…</div>;
  }
  if (!ticker) {
    return <div className="p-8 text-red-400 text-sm">Ticker not found.</div>;
  }

  const analyses = analysesData?.analyses ?? [];
  const latestCompleted = analyses.find((a) => a.status === "completed");

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm mt-1">
          ← Dashboard
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{ticker.symbol}</h1>
            <SignalBadge signal={ticker.latest_signal} />
          </div>
          {ticker.name && <p className="text-gray-500 text-sm mt-0.5">{ticker.name}</p>}
          <div className="flex gap-4 mt-1">
            {ticker.exchange && (
              <span className="text-xs text-gray-600">{ticker.exchange}</span>
            )}
            <span className="text-xs text-gray-600">{ticker.currency}</span>
          </div>
        </div>
      </div>

      {/* Signal history chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Signal history</h2>
        <SignalHistoryChart analyses={analyses} />
      </div>

      {/* Latest reasoning */}
      {latestCompleted?.reasoning && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            Latest AI reasoning{" "}
            <span className="text-gray-600 font-normal">
              ({latestCompleted.analysis_date})
            </span>
          </h2>
          <div className="bg-gray-950 rounded-lg p-4 max-h-80 overflow-y-auto">
            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
              {latestCompleted.reasoning}
            </pre>
          </div>
          {latestCompleted.confidence !== null && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Confidence:</span>
              <div className="flex-1 max-w-xs bg-gray-800 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${(latestCompleted.confidence ?? 0) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">
                {((latestCompleted.confidence ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Analysis history table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">
          Analysis history{" "}
          <span className="text-gray-600 font-normal">
            ({analysesData?.total ?? 0} total)
          </span>
        </h2>
        {analyses.length === 0 ? (
          <p className="text-gray-600 text-sm">No analyses yet. Run one from the dashboard.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Signal</th>
                <th className="pb-2 font-medium">Confidence</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {analyses.map((a) => {
                const duration =
                  a.started_at && a.completed_at
                    ? Math.round(
                        (new Date(a.completed_at).getTime() -
                          new Date(a.started_at).getTime()) /
                          1000
                      )
                    : null;
                return (
                  <tr key={a.id} className="hover:bg-gray-800/50">
                    <td className="py-2.5 text-gray-300">{a.analysis_date}</td>
                    <td className="py-2.5">
                      {a.signal ? (
                        <SignalBadge signal={a.signal as Signal} size="sm" />
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-400">
                      {a.confidence !== null ? `${(a.confidence * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-xs font-medium ${
                          a.status === "completed"
                            ? "text-emerald-400"
                            : a.status === "failed"
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {a.status}
                      </span>
                      {a.error_message && (
                        <p className="text-xs text-red-500 mt-0.5 max-w-xs truncate">
                          {a.error_message}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-600 text-xs">
                      {duration !== null ? `${duration}s` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
