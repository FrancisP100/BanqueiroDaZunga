import { Home, FilePlus2, ListChecks, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { getMvpData } from "@/lib/data";

export default async function ContasPage() {
  const { accounts, profiles } = await getMvpData();
  const user = profiles.find((profile) => profile.papel === "banqueiro")!;
  const myAccounts = accounts.filter((account) => account.banqueiroId === user.id);

  return (
    <AppShell
      title="Contas abertas"
      eyebrow="Relatorio do Banqueiro"
      userName={user.nome}
      userMeta={user.codigoInterno}
      navItems={[
        { href: "/banqueiro", label: "Dashboard", icon: Home },
        { href: "/banqueiro#nova-conta", label: "Abertura de conta", icon: FilePlus2 },
        { href: "/banqueiro/contas", label: "Contas", icon: ListChecks },
        { href: "/banqueiro/presenca", label: "Presenca GPS", icon: MapPin }
      ]}
    >
      <div className="rounded-2xl border border-bci-line bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
            <tr><th className="px-5 py-4">Cliente</th><th className="px-5 py-4">BI</th><th className="px-5 py-4">Telefone</th><th className="px-5 py-4">Mercado</th><th className="px-5 py-4">Estado</th></tr>
          </thead>
          <tbody>
            {myAccounts.map((account) => (
              <tr key={account.id} className="border-t border-bci-line">
                <td className="px-5 py-4 font-bold">{account.clienteNome}</td>
                <td className="px-5 py-4 text-bci-muted">{account.bi}</td>
                <td className="px-5 py-4">{account.telefone}</td>
                <td className="px-5 py-4">{account.mercadoNome}</td>
                <td className="px-5 py-4 capitalize">{account.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
