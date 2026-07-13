import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { ProfileView } from "@/components/profile-view";

export default function ChefePerfilPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/chefe"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-bci-muted hover:text-bci-blue transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar ao painel
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-bci-blue/10 flex items-center justify-center">
            <User size={16} className="text-bci-blue" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">
              Líder
            </p>
            <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-bci-ink">
              Meu Perfil
            </h1>
          </div>
        </div>
      </div>

      <ProfileView />
    </div>
  );
}
