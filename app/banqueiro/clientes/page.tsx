'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserCircle, MapPin, Phone, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function GestaoClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    // Get all accounts created by this banqueiro and extract unique clients
    const { data: accounts } = await supabase
      .from('accounts')
      .select(`
        id, pacote, status, tem_tpa, created_at,
        clientes (
          id, bi, nome, telefone, celular, endereco, created_at
        )
      `)
      .eq('banqueiro_id', profile.id)
      .order('created_at', { ascending: false });

    if (accounts) {
      // Group accounts by client
      const clientMap = new Map();
      
      accounts.forEach((acc: any) => {
        if (!acc.clientes) return;
        const cId = acc.clientes.id;
        if (!clientMap.has(cId)) {
          clientMap.set(cId, {
            ...acc.clientes,
            contas: []
          });
        }
        clientMap.get(cId).contas.push({
          id: acc.id,
          pacote: acc.pacote,
          status: acc.status,
          tem_tpa: acc.tem_tpa,
          data: acc.created_at
        });
      });

      setClientes(Array.from(clientMap.values()));
    }
    setLoading(false);
  };

  const filteredClientes = clientes.filter(c => 
    c.bi.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bci-dark">Gestão de Clientes</h1>
          <p className="text-gray-500">Acompanhe a sua carteira de clientes</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Pesquisar por BI ou Nome..." 
              className="pl-10 h-12 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">A carregar clientes...</div>
          ) : filteredClientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum cliente encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClientes.map((cliente) => (
                <div 
                  key={cliente.id} 
                  className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                  onClick={() => setSelectedCliente(cliente)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-bci-magenta/10 p-3 rounded-full text-bci-magenta">
                      <UserCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{cliente.nome}</h3>
                      <p className="text-sm text-gray-500">BI: {cliente.bi}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 flex justify-between border-t pt-3 mt-2">
                    <span>Contas: <strong className="text-bci-magenta">{cliente.contas.length}</strong></span>
                    <span>TPA: {cliente.contas.some((c:any) => c.tem_tpa) ? '✅' : '❌'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCliente} onOpenChange={(open) => !open && setSelectedCliente(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedCliente && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-bci-dark border-b pb-4">
                  Detalhes do Cliente
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  <UserCircle className="text-bci-magenta" size={20}/>
                  <div>
                    <p className="text-sm text-gray-500">Nome Completo</p>
                    <p className="font-medium">{selectedCliente.nome}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CreditCard className="text-bci-magenta" size={20}/>
                  <div>
                    <p className="text-sm text-gray-500">BI</p>
                    <p className="font-medium">{selectedCliente.bi}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-bci-magenta" size={20}/>
                  <div>
                    <p className="text-sm text-gray-500">Contactos</p>
                    <p className="font-medium">{selectedCliente.celular} {selectedCliente.telefone ? `/ ${selectedCliente.telefone}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="text-bci-magenta" size={20}/>
                  <div>
                    <p className="text-sm text-gray-500">Endereço</p>
                    <p className="font-medium">{selectedCliente.endereco}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-semibold text-lg mb-3">Histórico de Contas</h4>
                  <div className="space-y-2">
                    {selectedCliente.contas.map((conta: any) => (
                      <div key={conta.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium">{conta.pacote}</p>
                          <p className="text-xs text-gray-500">{new Date(conta.data).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${conta.status === 'aberta' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {conta.status.toUpperCase()}
                          </span>
                          <p className="text-xs mt-1 text-gray-600">TPA: {conta.tem_tpa ? 'Sim' : 'Não'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
