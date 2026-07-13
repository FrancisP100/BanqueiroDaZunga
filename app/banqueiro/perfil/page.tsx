import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { ProfileView } from "@/components/profile-view";

export default function BanqueiroPerfilPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/banqueiro"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-bci-muted hover:text-bci-magenta transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar ao dashboard
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-bci-magenta/10 flex items-center justify-center">
            <User size={16} className="text-bci-magenta" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-magenta/70">
              Bankeiro
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
