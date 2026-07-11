"use client";

import { useActionState } from "react";
import { registerProfile as defaultRegisterProfile } from "@/app/banqueiro/register/actions";
import type { Market, UserRole } from "@/lib/types";

type RegisterAction = (
  prevState: { error: string } | null,
  formData: FormData
) => Promise<{ error: string } | null>;

type ProfileFormProps = {
  role: UserRole;
  title: string;
  description: string;
  showMarket?: boolean;
  markets?: Market[];
  action?: RegisterAction;
};

export function ProfileForm({
  role,
  title,
  description,
  showMarket,
  markets = [],
  action,
}: ProfileFormProps) {
  const isLider = role === "chefe";
  const registerAction = action ?? defaultRegisterProfile;
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-2xl border border-bci-line bg-white p-5 shadow-card md:grid-cols-2"
    >
      <input name="papel" type="hidden" value={role} />

      <label className="text-sm font-bold text-bci-ink md:col-span-2">
        {title}
        <p className="mt-2 text-sm font-medium text-bci-muted">{description}</p>
        {isLider && (
          <p className="mt-1 text-xs font-semibold text-bci-magenta">
            ⚠️ O líder precisa de estar associado a um balcão (Mercado local ou Nº do Balcão)
          </p>
        )}
      </label>

      {state?.error && typeof state.error === "string" && state.error.length > 0 && (
        <div className="md:col-span-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <label className="text-sm font-bold text-bci-ink">
        Nome completo
        <input
          name="nome"
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder="Ana Maria"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Email
        <input
          name="email"
          type="email"
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder="ana@exemplo.com"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Codigo interno
        <input
          name="codigo_interno"
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder="BNC-001"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Telefone
        <input
          name="telefone"
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder="944 000 111"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Provincia
        <input
          name="provincia"
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder="Luanda"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Senha temporaria
        <input
          name="password"
          type="password"
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder="Mínimo 6 caracteres"
        />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Número do Balcão
        {isLider && <span className="text-bci-magenta ml-1">*</span>}
        <input
          name="numero_balcao"
          className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          placeholder={isLider ? "BCI-0030 (obrigatório se não escolher mercado)" : "BCI-0030"}
        />
      </label>
      {showMarket || isLider ? (
        <label className="text-sm font-bold text-bci-ink md:col-span-2">
          Mercado local
          {isLider && <span className="text-bci-magenta ml-1">*</span>}
          <select
            name="local_id"
            className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          >
            <option value="">{isLider ? "— Selecione um mercado (obrigatório se não tiver Nº Balcão) —" : "Nenhum"}</option>
            {markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.nome} — {market.provincia}
              </option>
            ))}
          </select>
          {isLider && (
            <p className="mt-1 text-[11px] text-bci-magenta font-medium">
              Preencha o mercado OU o número do balcão
            </p>
          )}
        </label>
      ) : null}

      <button
        className="rounded-xl bg-bci-navy px-5 py-3 text-sm font-extrabold text-white md:col-span-2 disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "A registar..." : `Cadastrar ${role === "banqueiro" ? "banqueiro" : "chefe"}`}
      </button>
    </form>
  );
}
