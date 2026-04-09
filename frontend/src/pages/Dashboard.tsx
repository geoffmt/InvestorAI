import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTickers, addTicker } from "../api/client";
import TickerCard from "../components/TickerCard";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    symbol: "",
    name: "",
    exchange: "",
    currency: "USD",
  });

  const { data: tickers = [], isLoading, isError } = useQuery({
    queryKey: ["tickers"],
    queryFn: fetchTickers,
    refetchInterval: 10_000,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      addTicker({
        symbol: form.symbol,
        name: form.name || undefined,
        exchange: form.exchange || undefined,
        currency: form.currency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickers"] });
      setShowForm(false);
      setForm({ symbol: "", name: "", exchange: "", currency: "USD" });
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track your investment targets and run AI analysis
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Ticker
        </button>
      </div>

      {/* Add ticker form */}
      {showForm && (
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Add new ticker</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Symbol *</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="AAPL"
                value={form.symbol}
                onChange={(e) =>
                  setForm((f) => ({ ...f, symbol: e.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Apple Inc."
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Exchange</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="NASDAQ"
                value={form.exchange}
                onChange={(e) => setForm((f) => ({ ...f, exchange: e.target.value }))}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Currency</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => addMutation.mutate()}
              disabled={!form.symbol || addMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {addMutation.isPending ? "Adding…" : "Add"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
          {addMutation.isError && (
            <p className="text-xs text-red-400 mt-2">
              {(addMutation.error as { response?: { data?: { detail?: string } } })?.response?.data
                ?.detail ?? "Failed to add ticker"}
            </p>
          )}
        </div>
      )}

      {/* Ticker grid */}
      {isLoading && (
        <div className="text-gray-500 text-sm">Loading tickers…</div>
      )}
      {isError && (
        <div className="text-red-400 text-sm">
          Failed to load tickers. Is the backend running?
        </div>
      )}
      {!isLoading && tickers.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <p className="text-lg">No tickers yet.</p>
          <p className="text-sm mt-1">Click "Add Ticker" to get started.</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tickers.map((ticker) => (
          <TickerCard key={ticker.id} ticker={ticker} />
        ))}
      </div>
    </div>
  );
}
