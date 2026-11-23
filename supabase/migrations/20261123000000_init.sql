-- Sistema AX: esquema inicial do piloto (Diagnóstico AX)
-- Isolamento: todo registro carrega tenant_id e client_id, com Row-Level Security.
--
-- Claims esperadas no JWT (assinado pelo nosso backend, nunca pelo modelo):
--   tenant_id  uuid   agência
--   client_id  uuid   presente em tokens de AGENTE: enxerga só esse cliente
--   ax_papel   text   'agente' | 'membro' (membro da agência vê todos os clientes do tenant)

create extension if not exists vector;
create schema if not exists ax;

-- ---------- Funções de acesso ----------
create or replace function ax.jwt_tenant() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

create or replace function ax.jwt_client() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'client_id', '')::uuid
$$;

create or replace function ax.jwt_papel() returns text language sql stable as $$
  select coalesce(auth.jwt() ->> 'ax_papel', 'agente')
$$;

-- Pode ver um registro de (tenant, cliente)?  client_id null = conhecimento do tenant.
create or replace function ax.pode_ver(p_tenant uuid, p_client uuid) returns boolean language sql stable as $$
  select p_tenant = ax.jwt_tenant()
     and (
       p_client is null
       or (ax.jwt_papel() = 'membro' and ax.jwt_client() is null)
       or p_client = ax.jwt_client()
     )
$$;

-- ---------- Tabelas ----------
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  plano text not null default 'interno',
  criado_em timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  nome text not null,
  segmento text,
  regulado boolean not null default false,
  status text not null default 'ativo' check (status in ('ativo','pausado','encerrado')),
  responsavel text,
  criado_em timestamptz not null default now(),
  unique (tenant_id, id)
);

create table public.briefings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid not null,
  versao int not null,
  respostas jsonb not null,
  lacunas jsonb not null default '[]',
  alertas_de_seguranca jsonb not null default '[]',
  aprovado_em timestamptz,
  aprovado_por text,
  criado_em timestamptz not null default now(),
  foreign key (tenant_id, client_id) references public.clientes(tenant_id, id),
  unique (client_id, versao)
);

create table public.diagnosticos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid not null,
  briefing_id uuid not null references public.briefings(id),
  tipo text not null check (tipo in ('mercado','marca','performance','relatorio')),
  versao int not null,
  conteudo jsonb not null,
  estado text not null default 'rascunho'
    check (estado in ('rascunho','aguardando_portao_b','escalado_para_humano','aprovado','rejeitado')),
  criado_em timestamptz not null default now(),
  foreign key (tenant_id, client_id) references public.clientes(tenant_id, id)
);

create table public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid not null,
  diagnostico_id uuid not null references public.diagnosticos(id),
  tentativa int not null,
  conteudo jsonb not null,
  criado_em timestamptz not null default now(),
  foreign key (tenant_id, client_id) references public.clientes(tenant_id, id)
);

create table public.aprovacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid not null,
  portao text not null check (portao in ('A','B','C','D','E')),
  objeto_tipo text not null,
  objeto_id uuid not null,
  decisao text not null check (decisao in ('aprovado','editado','rejeitado')),
  comentario text,
  decidido_por text not null,
  decidido_em timestamptz not null default now(),
  foreign key (tenant_id, client_id) references public.clientes(tenant_id, id)
);

create table public.registros_execucao (
  id bigint generated always as identity primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  agente text not null,
  modelo text not null,
  versao_prompt text not null,
  inicio timestamptz not null,
  duracao_ms int not null,
  tokens_entrada int not null,
  tokens_saida int not null,
  tokens_cache_lidos int not null default 0,
  tokens_cache_escritos int not null default 0,
  status text not null,
  erro text,
  foreign key (tenant_id, client_id) references public.clientes(tenant_id, id)
);

-- Conhecimento: client_id null = Método AX / minicérebro (nível tenant); preenchido = memória do cliente.
create table public.trechos_conhecimento (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  client_id uuid,
  camada text not null check (camada in ('metodo','minicerebro','cliente','mercado','pensadores')),
  minicerebro text,
  tipo text not null check (tipo in ('regra','exemplo','opiniao','dado')),
  origem text not null,           -- ex.: clickup:task/123, drive:file/abc
  hash_origem text not null,
  texto text not null,
  embedding vector(1024),
  revisado boolean not null default false,
  criado_em timestamptz not null default now(),
  foreign key (tenant_id, client_id) references public.clientes(tenant_id, id)
);
create index on public.trechos_conhecimento (tenant_id, client_id, camada);

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['briefings','diagnosticos','avaliacoes','aprovacoes','registros_execucao','trechos_conhecimento'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format($p$create policy isolamento_leitura on public.%I for select using (ax.pode_ver(tenant_id, client_id))$p$, t);
    execute format($p$create policy isolamento_escrita on public.%I for insert with check (ax.pode_ver(tenant_id, client_id))$p$, t);
    execute format($p$create policy isolamento_update on public.%I for update using (ax.pode_ver(tenant_id, client_id)) with check (ax.pode_ver(tenant_id, client_id))$p$, t);
  end loop;
end $$;

-- Agentes não aprovam nada: só membros da agência gravam em aprovacoes.
drop policy isolamento_escrita on public.aprovacoes;
create policy so_membro_aprova on public.aprovacoes for insert
  with check (ax.pode_ver(tenant_id, client_id) and ax.jwt_papel() = 'membro');

alter table public.clientes enable row level security;
alter table public.clientes force row level security;
create policy isolamento_leitura on public.clientes for select using (ax.pode_ver(tenant_id, id));

alter table public.tenants enable row level security;
alter table public.tenants force row level security;
create policy proprio_tenant on public.tenants for select using (id = ax.jwt_tenant());
-- Nenhuma policy de delete: exclusão de dados é sempre manual, com a Laura.
