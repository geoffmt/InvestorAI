import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Analysis } from "../types";

interface Props {
  analyses: Analysis[];
}

const signalValue = (s: string | null) => {
  if (s === "BUY") return 1;
  if (s === "SELL") return -1;
  return 0;
};

const signalColor = (v: number) => {
  if (v === 1) return "#34d399";
  if (v === -1) return "#f87171";
  return "#f59e0b";
};

export default function SignalHistoryChart({ analyses }: Props) {
  const data = [...analyses]
    .filter((a) => a.status === "completed")
    .reverse()
    .map((a) => ({
      date: a.analysis_date,
      value: signalValue(a.signal),
      signal: a.signal ?? "HOLD",
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        No completed analyses yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[-1.5, 1.5]}
          ticks={[-1, 0, 1]}
          tickFormatter={(v) => (v === 1 ? "BUY" : v === -1 ? "SELL" : "HOLD")}
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(_: number, __: string, entry: { payload: { signal: string } }) => [entry.payload.signal, "Signal"]}
          contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
          labelStyle={{ color: "#d1d5db" }}
        />
        <ReferenceLine y={0} stroke="#374151" />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={signalColor(entry.value)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
