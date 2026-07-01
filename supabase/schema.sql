create type user_role as enum ('banqueiro', 'chefe', 'admin');
create type account_status as enum ('aberta', 'pendente');
create type presence_status as enum ('no_local', 'fora_do_local', 'falta');
create type punctuality_status as enum ('no_horario', 'atraso', 'falta');
create type presence_origin as enum ('gps', 'automatica', 'manual');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nome text not null,
  codigo_interno text not null unique,
  papel user_role not null,
  telefone text,
  provincia text,
  local_id uuid,
  numero_balcao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table markets (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  provincia text not null,
  tipo text not null default 'mercado',
  balcao text,
  latitude double precision not null,
  longitude double precision not null,
  raio_metros integer not null default 100,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_local_id_fkey foreign key (local_id) references markets(id);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  bi text not null unique,
  nome text not null,
  telefone text,
  celular text,
  endereco text,
  bi_emissao date,
  bi_validade date,
  created_at timestamptz not null default now()
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  banqueiro_id uuid not null references profiles(id),
  cliente_id uuid not null references clientes(id),
  pacote text not null,
  mercado_id uuid not null references markets(id),
  status account_status not null default 'aberta',
  tem_tpa boolean not null default false,
  tpa_status text not null default 'pendente',
  hora_abertura time,
  created_at timestamptz not null default now()
);

create table presences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  data date not null default current_date,
  entrada time,
  saida time,
  latitude double precision,
  longitude double precision,
  mercado_id uuid references markets(id),
  status presence_status not null,
  pontualidade punctuality_status not null,
  origem presence_origin not null default 'gps',
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (profile_id, data)
);

create table punctuality_settings (
  id boolean primary key default true,
  hora_limite time not null default '08:00',
  tolerancia_min integer not null default 15,
  updated_at timestamptz not null default now(),
  constraint single_settings_row check (id)
);

insert into punctuality_settings (id) values (true)
on conflict (id) do nothing;

create index accounts_banqueiro_created_idx on accounts (banqueiro_id, created_at desc);
create index accounts_cliente_idx on accounts (cliente_id);
create index presences_data_idx on presences (data desc);
create index profiles_papel_idx on profiles (papel);
create index clientes_bi_idx on clientes (bi);
