import { useQuery } from "@tanstack/react-query";
import { fetchAllocationProposal } from "../api/client";
import AllocationPieChart from "../components/AllocationPieChart";
import SignalBadge from "../components/SignalBadge";
import type { Signal } from "../types";

export default function Allocation() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["allocation"],
    queryFn: fetchAllocationProposal,
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Monthly Allocation</h1>
          <p className="text-gray-500 text-sm mt-1">
            Proposed 1000 € allocation based on latest AI signals
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="text-gray-500 text-sm">Computing allocation…</div>
      )}
      {isError && (
        <div className="text-red-400 text-sm">Failed to load allocation.</div>
      )}

      {data && (
        <div className="space-y-8">
          {/* Budget header */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monthly Budget</p>
            <p className="text-3xl font-bold text-white">
              €{data.total_budget.toFixed(2)}{" "}
              <span className="text-base font-normal text-gray-500">{data.currency}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Generated at {new Date(data.generated_at).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Pie chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Allocation breakdown</h2>
              <AllocationPieChart allocations={data.allocations} />
            </div>

            {/* Allocation table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Included tickers</h2>
              {data.allocations.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  No allocations — run analyses first.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                      <th className="pb-2 font-medium">Ticker</th>
                      <th className="pb-2 font-medium">Signal</th>
                      <th className="pb-2 font-medium text-right">Weight</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {data.allocations.map((a) => (
                      <tr key={a.ticker_id} className="hover:bg-gray-800/50">
                        <td className="py-2.5 font-semibold text-white">{a.symbol}</td>
                        <td className="py-2.5">
                          <SignalBadge signal={a.signal as Signal} size="sm" />
                        </td>
                        <td className="py-2.5 text-right text-gray-400">
                          {(a.weight * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-right font-semibold text-emerald-400">
                          €{a.amount_eur.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-700">
                      <td colSpan={3} className="pt-2 text-xs text-gray-500">
                        Total
                      </td>
                      <td className="pt-2 text-right font-bold text-white">
                        €
                        {data.allocations
                          .reduce((s, a) => s + a.amount_eur, 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          {/* Excluded & unanalyzed */}
          {(data.excluded.length > 0 || data.unanalyzed.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {data.excluded.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-red-400 mb-3">Excluded (SELL)</h2>
                  <ul className="space-y-1">
                    {data.excluded.map((e) => (
                      <li key={e.ticker_id} className="flex justify-between text-sm">
                        <span className="font-semibold text-white">{e.symbol}</span>
                        <span className="text-gray-500">{e.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.unanalyzed.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-amber-400 mb-3">Not yet analysed</h2>
                  <ul className="space-y-1">
                    {data.unanalyzed.map((e) => (
                      <li key={e.ticker_id} className="flex justify-between text-sm">
                        <span className="font-semibold text-white">{e.symbol}</span>
                        <span className="text-gray-500">{e.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
