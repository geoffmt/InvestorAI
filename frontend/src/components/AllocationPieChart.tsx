import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AllocationItem } from "../types";

const COLORS = [
  "#6366f1", "#22d3ee", "#34d399", "#f59e0b", "#f87171",
  "#a78bfa", "#38bdf8", "#4ade80", "#fbbf24", "#fb7185",
];

interface Props {
  allocations: AllocationItem[];
}

interface TooltipPayload {
  name: string;
  value: number;
}

export default function AllocationPieChart({ allocations }: Props) {
  if (allocations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No allocations to display
      </div>
    );
  }

  const data = allocations.map((a) => ({
    name: a.symbol,
    value: a.amount_eur,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={120}
          dataKey="value"
          label={({ name, value }: TooltipPayload) => `${name}: €${value.toFixed(0)}`}
          labelLine={true}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`€${value.toFixed(2)}`, "Amount"]}
          contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
          labelStyle={{ color: "#f9fafb" }}
        />
        <Legend
          formatter={(value) => <span style={{ color: "#d1d5db" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
