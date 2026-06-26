'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { LogIn, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
          .from('profiles')
          .select('papel')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        // Redirect based on role
        if (profileData.papel === 'banqueiro') {
          router.push('/banqueiro');
        } else if (profileData.papel === 'chefe') {
          router.push('/chefe');
        } else if (profileData.papel === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao efetuar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bci-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-bci-magenta p-6 flex flex-col items-center justify-center text-white">
          <Building2 size={48} className="mb-2" />
          <h1 className="text-2xl font-bold">Banco de Comércio e Indústria</h1>
          <p className="text-white/80">Banqueiros da Zumba</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Iniciar Sessão</h2>
          
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
                'A entrar...'
              ) : (
                <>
                  <LogIn size={20} className="mr-2" />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
