"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePasswordModal({ open, onClose, onSuccess }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      // 1. Alterar a senha no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // 2. Marcar force_password_change como false no perfil
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ force_password_change: false })
          .eq("id", user.id);

        if (profileError) {
          console.error("Erro ao actualizar perfil:", profileError);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-soft mx-4 animate-in fade-in zoom-in duration-200">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-bci-magenta/10 mb-4">
            <svg className="h-7 w-7 text-bci-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-bci-ink">Alterar Senha</h2>
          <p className="mt-2 text-sm text-bci-muted">
            Por segurança, defina uma nova senha para a sua conta.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-bci-ink mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-magenta focus:ring-4 focus:ring-pink-100"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-bci-ink mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-magenta focus:ring-4 focus:ring-pink-100"
              placeholder="Repita a nova senha"
              minLength={6}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors"
            >
              Agora não
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-bci-magenta px-4 py-3 text-sm font-extrabold text-white hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "A alterar..." : "Alterar Senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
