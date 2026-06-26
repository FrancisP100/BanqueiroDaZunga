import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // For MVP we use anon, in production service role is better
  );

  try {
    // 1. Obter regras de pontualidade
    const { data: settings } = await supabase
      .from('punctuality_settings')
      .select('hora_limite, tolerancia_min')
      .single();

    if (!settings) {
      return NextResponse.json({ message: 'Sem configurações de pontualidade' }, { status: 200 });
    }

    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    
    const [hL, mL] = settings.hora_limite.split(':').map(Number);
    const limiteMinutos = (hL * 60) + mL + settings.tolerancia_min;

    // Se ainda não passou da hora limite + tolerância, não gera faltas
    if (horaAtual <= limiteMinutos) {
      return NextResponse.json({ message: 'Ainda não atingiu a hora limite de faltas.' }, { status: 200 });
    }

    // 2. Passou da hora limite. Obter todos os banqueiros ativos
    const { data: banqueiros } = await supabase
      .from('profiles')
      .select('id, local_id')
      .eq('papel', 'banqueiro')
      .eq('ativo', true);

    if (!banqueiros || banqueiros.length === 0) {
      return NextResponse.json({ message: 'Nenhum banqueiro ativo' }, { status: 200 });
    }

    const hoje = agora.toISOString().split('T')[0];

    // 3. Obter presenças de hoje
    const { data: presencasHoje } = await supabase
      .from('presences')
      .select('profile_id')
      .eq('data', hoje);

    const banqueirosComPresenca = new Set(presencasHoje?.map(p => p.profile_id) || []);

    // 4. Filtrar quem não tem presença
    const faltosos = banqueiros.filter(b => !banqueirosComPresenca.has(b.id));

    // 5. Inserir faltas para os faltosos
    const inserts = faltosos.map(b => ({
      profile_id: b.id,
      data: hoje,
      mercado_id: b.local_id,
      status: 'falta',
      pontualidade: 'falta',
      origem: 'automatica'
    }));

    if (inserts.length > 0) {
      // Inserir ignorando duplicados (unique constraint profile_id + data)
      const { error } = await supabase.from('presences').upsert(inserts, { onConflict: 'profile_id,data', ignoreDuplicates: true });
      if (error) throw error;
    }

    return NextResponse.json({ 
      message: 'Verificação concluída', 
      faltasGeradas: inserts.length 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
