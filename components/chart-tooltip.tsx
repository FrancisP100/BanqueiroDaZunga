const COLORS: Record<string, string> = {
  Mãezinha: "#e91e63",
  Mãe: "#9c27b0",
  "Mãe Grande": "#3f51b5",
  Mamoite: "#009688",
  Entregues: "#10b981",
  Pendentes: "#f59e0b",
  Abertas: "#10b981",
  "TPA Entregues": "#06b6d4",
  "TPA Pendentes": "#f97316",
  Contas: "#e91e63",
  Bankeiros: "#0f4a8a",
};

function getColor(name: string): string {
  return COLORS[name] ?? "#6b7280";
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // Pie chart: single payload with name + percent
  // Bar/Line chart: multiple payloads with dataKey + name
  const isPie = payload.length === 1 && payload[0]?.payload?.percent !== undefined;

  const total = payload.reduce(
    (sum: number, entry: any) => sum + (Number(entry.value) || 0),
    0,
  );

  return (
    <div className="rounded-xl border border-bci-line bg-white px-4 py-3 shadow-xl backdrop-blur-sm min-w-[160px]">
      {/* Label / date header */}
      {label && (
        <p className="text-xs font-bold text-bci-muted mb-2 border-b border-bci-line pb-1.5">
          {label}
        </p>
      )}

      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          const name = entry.name ?? entry.dataKey ?? "";
          const value = Number(entry.value) ?? 0;
          const color = entry.color ?? entry.payload?.color ?? getColor(name);
          const pct =
            total > 0 ? ((value / total) * 100).toFixed(1) : null;

          return (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-semibold text-bci-ink whitespace-nowrap">
                  {name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-bci-ink tabular-nums">
                  {value}
                </span>
                {isPie && pct && (
                  <span className="text-[10px] font-bold text-bci-muted">
                    ({pct}%)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total row for multi-series charts */}
      {!isPie && payload.length > 1 && (
        <div className="mt-2 pt-1.5 border-t border-bci-line flex items-center justify-between">
          <span className="text-xs font-semibold text-bci-muted">Total</span>
          <span className="text-xs font-extrabold text-bci-ink tabular-nums">
            {total}
          </span>
        </div>
      )}
    </div>
  );
}
