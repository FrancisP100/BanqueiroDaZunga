"use client";

import { useTransition } from "react";
import { toggleProfileStatus } from "@/app/admin/actions";
import { Lock, Unlock } from "lucide-react";

interface Props {
  profileId: string;
  profileName: string;
  ativo: boolean;
}

export function ToggleProfileStatus({ profileId, profileName, ativo }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const acao = ativo ? "bloquear" : "desbloquear";
    if (!confirm(`Tem a certeza que deseja ${acao} "${profileName}"?`)) return;

    startTransition(async () => {
      await toggleProfileStatus(profileId, !ativo);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-colors disabled:opacity-50 ${
        ativo
          ? "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white"
          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
      }`}
      title={ativo ? "Bloquear acesso" : "Desbloquear acesso"}
    >
      {isPending ? (
        "A processar..."
      ) : ativo ? (
        <>
          <Lock size={14} /> Bloquear
        </>
      ) : (
        <>
          <Unlock size={14} /> Desbloquear
        </>
      )}
    </button>
  );
}
