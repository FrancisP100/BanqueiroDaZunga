import type { PresenceStatus, Punctuality } from "@/lib/types";

const punctualityLabels: Record<Punctuality, string> = {
  no_horario: "No horario",
  atraso: "Atraso",
  falta: "Falta"
};

const presenceLabels: Record<PresenceStatus, string> = {
  no_local: "No local",
  fora_do_local: "Fora do local",
  falta: "Falta"
};

const badgeClasses = {
  no_horario: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  no_local: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  atraso: "bg-amber-50 text-amber-700 ring-amber-100",
  fora_do_local: "bg-rose-50 text-rose-700 ring-rose-100",
  falta: "bg-slate-100 text-slate-700 ring-slate-200"
};

export function PunctualityBadge({ value }: { value: Punctuality }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${badgeClasses[value]}`}>{punctualityLabels[value]}</span>;
}

export function PresenceBadge({ value }: { value: PresenceStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${badgeClasses[value]}`}>{presenceLabels[value]}</span>;
}
