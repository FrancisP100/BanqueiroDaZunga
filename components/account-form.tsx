import { createAccount } from "@/app/banqueiro/actions";
import type { Market } from "@/lib/types";

export function AccountForm({ markets }: { markets: Market[] }) {
  return (
    <form action={createAccount} className="grid gap-4 rounded-2xl border border-bci-line bg-white p-5 shadow-card md:grid-cols-2">
      <label className="text-sm font-bold text-bci-ink">
        Nome da cliente
        <input name="cliente_nome" className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100" placeholder="Rosa Capalo" />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Bilhete de identidade
        <input name="bi" className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100" placeholder="002948221LA048" />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Telefone
        <input name="telefone" className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100" placeholder="945 221 009" />
      </label>
      <label className="text-sm font-bold text-bci-ink">
        Pacote
        <select name="pacote" className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100">
          <option>Pacote Zungueira Basico</option>
          <option>Pacote Zungueira Plus</option>
          <option>Pacote Zungueira Empreendedora</option>
        </select>
      </label>
      <label className="text-sm font-bold text-bci-ink md:col-span-2">
        Mercado
        <select name="mercado_id" className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100">
          {markets.map((market) => (
            <option key={market.id} value={market.id}>
              {market.nome} - {market.provincia}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center justify-between gap-3 md:col-span-2">
        <p className="text-sm text-bci-muted">O registo e gravado em accounts quando o Supabase esta configurado.</p>
        <button className="rounded-xl bg-bci-pink px-5 py-3 text-sm font-extrabold text-white shadow-pink" type="submit">
          Criar conta
        </button>
      </div>
    </form>
  );
}
