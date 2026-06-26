'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function AbrirConta() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState<{
    nome: string;
    bi: string;
    telefone: string;
    celular: string;
    endereco: string;
    pacote: string;
    temTpa: boolean;
  }>({
    nome: '',
    bi: '',
    telefone: '',
    celular: '',
    endereco: '',
    pacote: 'Zumba Base',
    temTpa: false,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, local_id')
        .eq('id', user.id)
        .single();
        
      if (!profile) throw new Error("Perfil não encontrado");

      // 1. Inserir ou atualizar cliente
      let clienteId;
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('bi', formData.bi)
        .single();

      if (existingClient) {
        clienteId = existingClient.id;
        // Opcional: Atualizar dados do cliente se já existir
        await supabase.from('clientes').update({
          nome: formData.nome,
          telefone: formData.telefone,
          celular: formData.celular,
          endereco: formData.endereco,
        }).eq('id', clienteId);
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clientes')
          .insert({
            bi: formData.bi,
            nome: formData.nome,
            telefone: formData.telefone,
            celular: formData.celular,
            endereco: formData.endereco,
          })
          .select('id')
          .single();
          
        if (clientError) throw clientError;
        clienteId = newClient.id;
      }

      // 2. Inserir conta
      const { error: accountError } = await supabase.from('accounts').insert({
        banqueiro_id: profile.id,
        cliente_id: clienteId,
        pacote: formData.pacote,
        mercado_id: profile.local_id,
        tem_tpa: formData.temTpa,
        status: 'aberta'
      });

      if (accountError) throw accountError;

      alert("Conta aberta com sucesso!");
      router.push('/banqueiro');
      
    } catch (error: any) {
      alert("Erro ao abrir conta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="bg-bci-dark text-white rounded-t-xl">
          <CardTitle className="text-2xl">Abrir Nova Conta</CardTitle>
          <CardDescription className="text-white/80">
            Registe um novo cliente e associe uma conta
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Dados do Cliente</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input 
                    id="nome" 
                    required 
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bi">Número do BI</Label>
                  <Input 
                    id="bi" 
                    required 
                    value={formData.bi}
                    onChange={(e) => setFormData({...formData, bi: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input 
                    id="telefone" 
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="celular">Celular</Label>
                  <Input 
                    id="celular" 
                    required 
                    value={formData.celular}
                    onChange={(e) => setFormData({...formData, celular: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço (Bairro / Rua)</Label>
                  <Input 
                    id="endereco" 
                    required 
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold border-b pb-2">Detalhes da Conta</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pacote">Pacote</Label>
                  <Select 
                    value={formData.pacote} 
                    onValueChange={(val) => setFormData({...formData, pacote: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um pacote" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zumba Base">Zumba Base</SelectItem>
                      <SelectItem value="Zumba Plus">Zumba Plus</SelectItem>
                      <SelectItem value="Zumba Premium">Zumba Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="tpa" 
                    checked={formData.temTpa}
                    onCheckedChange={(checked) => setFormData({...formData, temTpa: checked as boolean})}
                  />
                  <Label htmlFor="tpa" className="cursor-pointer">
                    Cliente recebeu o TPA (Terminal de Pagamento)
                  </Label>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-bci-magenta hover:bg-bci-magenta/90 text-white py-6 text-lg"
              >
                {loading ? 'A processar...' : 'Concluir Abertura de Conta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
