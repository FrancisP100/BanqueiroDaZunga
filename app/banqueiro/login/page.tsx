"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { LogIn, Building2, ArrowLeft, UserRound } from "lucide-react";

export default function BanqueiroLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Fetch user profile to get the role
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("papel")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        // Verify the user is a banqueiro
        if (profileData.papel !== "banqueiro") {
          setError("Acesso negado. Esta área é apenas para banqueiros.");
          await supabase.auth.signOut();
          return;
        }

        router.push("/banqueiro");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao efetuar login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bci-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-bci-magenta p-6 flex flex-col items-center justify-center text-white">
          <UserRound size={48} className="mb-2" />
          <h1 className="text-2xl font-bold">Banco de Comércio e Indústria</h1>
          <p className="text-white/80">Área do Banqueiro</p>
        </div>

        <div className="p-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Voltar à página inicial
          </Link>

          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Iniciar Sessão como Banqueiro
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-bci-magenta focus:border-bci-magenta"
                placeholder="seu.email@bci.ao"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Palavra-passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-bci-magenta focus:border-bci-magenta"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bci-magenta hover:bg-bci-magenta/90 text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center disabled:opacity-70 mt-6"
            >
              {loading ? (
                "A entrar..."
              ) : (
                <>
                  <LogIn size={20} className="mr-2" />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Não tem conta?{" "}
            <Link
              href="/banqueiro/register"
              className="font-bold text-bci-magenta hover:underline"
            >
              Registar-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}