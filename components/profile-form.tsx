import { registerProfile } from "@/app/banqueiro/register/actions";
import type { Market, UserRole } from "@/lib/types";

type ProfileFormProps = {
  role: UserRole;
  title: string;
  description: string;
  showMarket?: boolean;
  markets?: Market[];
};

export function ProfileForm({
  role,
  title,
  description,
  showMarket,
  markets = [],
}: ProfileFormProps) {
  return (
    <form
      action={registerProfile}
      className="grid gap-4 rounded-2xl border border-bci-line bg-white p-5 shadow-card md:grid-cols-2"
    >
      <input name="papel" type="hidden" value={role} />
      <label className="text-sm font-bold text-bci-ink md:col-span-2">
        {title}
        <p className="mt-2 text-sm font-medium text-bci-muted">{description}</p>
      </label>
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
          placeholder="Uma senha segura"
        />
      </label>
      {showMarket ? (
        <label className="text-sm font-bold text-bci-ink md:col-span-2">
          Mercado local
          <select
            name="local_id"
            className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100"
          >
            <option value="">Nenhum</option>
            {markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.nome} — {market.provincia}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="md:col-span-2">
        <p className="text-sm text-bci-muted">
          O registo sera persistido no Supabase sempre que a configuracao de
          ambiente estiver ativa.
        </p>
      </div>
      <button
        className="rounded-xl bg-bci-navy px-5 py-3 text-sm font-extrabold text-white md:col-span-2"
        type="submit"
      >
        Cadastrar {role === "banqueiro" ? "banqueiro" : "chefe"}
      </button>
    </form>
  );
}
