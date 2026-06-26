# Bankeiros da Zunga MVP

Aplicacao Next.js para substituir o prototipo single-file do sistema Bankeiros da Zunga.

## Stack

- Next.js App Router, React e TypeScript
- Tailwind CSS
- Supabase Auth e PostgreSQL
- Leaflet/react-leaflet para mapas

## Primeiros passos

1. Instale dependencias com `npm install`.
2. Copie `.env.example` para `.env.local` e preencha as chaves do Supabase.
3. Se quiser visualizar as páginas sem sessão Supabase localmente, adicione `NEXT_PUBLIC_BYPASS_AUTH=1` ao `.env.local`.
4. Execute `supabase/schema.sql` no SQL Editor do Supabase.
5. Rode `npm run dev`.

## Rotas MVP

- `/login` para entrada por papel.
- `/banqueiro` para dashboard, abertura de contas e presenca.
- `/chefe` para mapa operacional, estatisticas e correcao de presenca.
- `/admin` para gestao de mercados, utilizadores e regra de pontualidade.

Os dados em `lib/mock-data.ts` mantem as telas demonstraveis enquanto o Supabase e populado.
