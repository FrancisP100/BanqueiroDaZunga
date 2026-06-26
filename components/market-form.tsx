import { createMarket } from "@/app/admin/actions";

export function MarketForm() {
  return (
    <form action={createMarket} className="grid gap-4 rounded-2xl border border-bci-line bg-white p-5 shadow-card md:grid-cols-2">
      {[
        ["nome", "Nome", "Mercado do Benfica"],
        ["provincia", "Provincia", "Luanda"],
        ["tipo", "Tipo", "mercado"],
        ["balcao", "Balcao", "BCI-0612"],
        ["latitude", "Latitude", "-9.0271"],
        ["longitude", "Longitude", "13.1614"]
      ].map(([name, label, placeholder]) => (
        <label key={name} className="text-sm font-bold text-bci-ink">
          {label}
          <input name={name} className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100" placeholder={placeholder} />
        </label>
      ))}
      <label className="text-sm font-bold text-bci-ink">
        Raio permitido (m)
        <input name="raio_metros" className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100" defaultValue="100" />
      </label>
      <button className="rounded-xl bg-bci-navy px-5 py-3 text-sm font-extrabold text-white md:col-span-2" type="submit">
        Guardar mercado
      </button>
    </form>
  );
}
