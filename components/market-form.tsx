"use client";

import { useActionState, useEffect, useRef } from "react";
import { createMarket, editMarket } from "@/app/admin/actions";
import { ProvinciaSelect } from "@/components/ui/provincia-select";
import type { Market } from "@/lib/types";

type MarketFormProps = {
  onSuccess?: () => void;
  market?: Market; // se fornecido, entra em modo edição
};

// Wrapper para compatibilidade com useActionState
async function wrappedCreateMarket(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  try {
    await createMarket(formData);
    return null;
  } catch (e: any) {
    return { error: e?.message || "Erro ao criar mercado" };
  }
}

async function wrappedEditMarket(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  return editMarket(_prev, formData);
}

export function MarketForm({ onSuccess, market }: MarketFormProps) {
  const isEditing = !!market;
  const action = isEditing ? wrappedEditMarket : wrappedCreateMarket;
  const [state, formAction, pending] = useActionState(action, null);

  // Auto-fechar modal após submissão bem-sucedida
  const prevPending = useRef(pending);
  useEffect(() => {
    if (prevPending.current && !pending && !state?.error) {
      onSuccess?.();
    }
    prevPending.current = pending;
  }, [pending, state, onSuccess]);

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-bci-line bg-white p-5 shadow-card md:grid-cols-2">
      {isEditing && (
        <input type="hidden" name="id" value={market.id} />
      )}

      {state?.error && (
        <div className="md:col-span-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <label className="text-sm font-bold text-bci-ink">
        Nome
        <span className="text-bci-magenta ml-1">*</span>
        <input
          name="nome"
          required
          defaultValue={market?.nome ?? ""}
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder="Mercado do Benfica"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Província
        <span className="text-bci-magenta ml-1">*</span>
        <ProvinciaSelect
          name="provincia"
          required
          defaultValue={market?.provincia ?? ""}
          className="focus:ring-pink-100"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Tipo
        <select
          name="tipo"
          defaultValue={market?.tipo ?? "mercado"}
          className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
        >
          <option value="mercado">Mercado</option>
          <option value="balcao">Balcão</option>
        </select>
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Balcão
        <input
          name="balcao"
          defaultValue={market?.balcao ?? ""}
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder="BCI-0612"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Latitude
        <span className="text-bci-magenta ml-1">*</span>
        <input
          name="latitude"
          type="number"
          step="any"
          required
          defaultValue={market?.latitude ?? ""}
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder="-9.0271"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Longitude
        <span className="text-bci-magenta ml-1">*</span>
        <input
          name="longitude"
          type="number"
          step="any"
          required
          defaultValue={market?.longitude ?? ""}
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder="13.1614"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Raio permitido (m)
        <input
          name="raio_metros"
          type="number"
          defaultValue={market?.raioMetros ?? 100}
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
        />
      </label>
      <button
        className="rounded-xl bg-bci-navy px-5 py-3 text-sm font-extrabold text-white md:col-span-2 disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending
          ? "A guardar..."
          : isEditing
            ? "Actualizar mercado"
            : "Guardar mercado"}
      </button>
    </form>
  );
}
