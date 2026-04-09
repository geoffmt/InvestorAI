import type { Signal } from "../types";

const styles: Record<Signal, string> = {
  BUY: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  HOLD: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  SELL: "bg-red-500/20 text-red-400 border border-red-500/30",
};

interface Props {
  signal: Signal | null;
  size?: "sm" | "md";
}

export default function SignalBadge({ signal, size = "md" }: Props) {
  if (!signal) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
        No data
      </span>
    );
  }
  const px = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center rounded font-semibold ${px} ${styles[signal]}`}>
      {signal}
    </span>
  );
}
