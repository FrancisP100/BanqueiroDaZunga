"use client";

import { useActionState, useEffect, useRef } from "react";
import { createMarket } from "@/app/admin/actions";
import { PROVINCIAS_ANGOLA } from "@/lib/constants";

type MarketFormProps = {
  onSuccess?: () => void;
};

// Wrapper para compatibilidade com useActionState (que espera (prevState, formData) => state)
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

export function MarketForm({ onSuccess }: MarketFormProps) {
  const [state, formAction, pending] = useActionState(wrappedCreateMarket, null);

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
      {state?.error && (
        <div className="md:col-span-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <label className="text-sm font-bold text-bci-ink">
        Nome
        <span className="text-bci-magenta ml-1">*</span>
        <input name="nome" required className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100" placeholder="Mercado do Benfica" />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Província
        <span className="text-bci-magenta ml-1">*</span>
        <select name="provincia" required className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100">
          <option value="">— Selecione a província —</option>
          {PROVINCIAS_ANGOLA.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Tipo
        <select name="tipo" className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100">
          <option value="mercado">Mercado</option>
          <option value="balcao">Balcão</option>
        </select>
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Balcão
        <input name="balcao" className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100" placeholder="BCI-0612" />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Latitude
        <span className="text-bci-magenta ml-1">*</span>
        <input name="latitude" type="number" step="any" required className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100" placeholder="-9.0271" />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Longitude
        <span className="text-bci-magenta ml-1">*</span>
        <input name="longitude" type="number" step="any" required className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100" placeholder="13.1614" />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Raio permitido (m)
        <input name="raio_metros" type="number" className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100" defaultValue="100" />
      </label>
      <button
        className="rounded-xl bg-bci-navy px-5 py-3 text-sm font-extrabold text-white md:col-span-2 disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "A guardar..." : "Guardar mercado"}
      </button>
    </form>
  );
}
