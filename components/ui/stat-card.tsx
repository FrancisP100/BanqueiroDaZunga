import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  tone?: "pink" | "navy" | "gold";
};

const toneClasses = {
  pink: "bg-bci-pinkSoft text-bci-pink",
  navy: "bg-slate-100 text-bci-navy",
  gold: "bg-bci-goldSoft text-bci-gold"
};

export function StatCard({ label, value, hint, icon: Icon, tone = "navy" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-bci-muted">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-bci-ink">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-bci-muted">{hint}</p>
    </div>
  );
}
