-- Sistema AX: contas, produtos, informações, análises por categoria e entregas.
-- O catálogo de categorias e subcategorias mora em src/estrategia/catalogo.ts (versionado).
-- Aqui ficam só os dados de cada conta, sempre com tenant_id + client_id e RLS.

-- ---------- Conta: dados básicos para o card da abertura ----------
alter table public.clientes add column nicho text;
alter table public.clientes add column slug text;
create unique index clientes_slug on public.clientes (tenant_id, slug) where slug is not null;

-- Membro da agência cadastra e edita contas; agente só lê a própria.
create policy membro_cadastra on public.clientes for insert
  with check (tenant_id = ax.jwt_tenant() and ax.jwt_papel() = 'membro' and ax.jwt_client() is null);
create policy membro_edita on public.clientes for update
  using (tenant_id = ax.jwt_tenant() and ax.jwt_papel() = 'membro' and ax.jwt_client() is null)
  with check (tenant_id = ax.jwt_tenant());

-- Briefing dinâmico: as respostas continuam em briefings.respostas (jsonb),
-- e cada versão grava com qual versão do catálogo foi feita.
alter table public.briefings add column catalogo_versao text not null default '1.0.0';

-- ---------- Produtos e serviços da conta ----------
create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid not null,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  foreign key (tenant_id, client_id) references public.clientes(tenant_id, id),
  unique (client_id, id),
  unique (client_id, nome)
);

-- ---------- Informações cadastradas (botão "Cadastrar informação") ----------
create table public.informacoes_conta (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid not null,
  tipo text not null check (tipo in ('documento','link','nota','reuniao','resultado')),
  descricao text not null,
  origem text,                    -- ex.: drive:file/abc, clickup:task/123, url
  cadastrado_por text not null,
  criado_em timestamptz not null default now(),
  foreign key (tenant_id, client_id) references public.clientes(tenant_id, id)
);

-- ---------- Análises (uma por subcategoria, por produto quando fizer sentido) ----------
create table public.analises (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid not null,
  produto_id uuid,                -- null = análise geral da conta
  categoria text not null check (categoria in ('branding','posicionamento','negocio','vendas','plano','resultados')),
  subcategoria text not null,
  catalogo_versao text not null,
  versao int not null default 1,
  briefing_id uuid references public.briefings(id),
  estado text not null default 'nao_iniciada'
    check (estado in ('nao_iniciada','em_analise','aguardando_aprovacao','ajuste_pedido','aprovada','escalada')),
  conteudo jsonb,
  executado_por text,             -- nome do agente ou 'codigo'
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (tenant_id, client_id) references public.clientes(tenant_id, id),
  foreign key (client_id, produto_id) references public.produtos(client_id, id)
);
create unique index analises_uma_por_versao
  on public.analises (client_id, subcategoria, coalesce(produto_id, '00000000-0000-0000-0000-000000000000'::uuid), versao);
create index on public.analises (tenant_id, client_id, categoria);

-- ---------- Entregas montadas a partir das análises aprovadas ----------
create table public.entregas_conta (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid not null,
  tipo text not null check (tipo in ('plano_de_marketing','plano_de_comunicacao')),
  versao int not null,
  analises uuid[] not null,       -- ids das análises aprovadas que entraram
  conteudo jsonb not null,
  estado text not null default 'aguardando_aprovacao'
    check (estado in ('aguardando_aprovacao','ajuste_pedido','aprovada')),
  criado_em timestamptz not null default now(),
  foreign key (tenant_id, client_id) references public.clientes(tenant_id, id),
  unique (client_id, tipo, versao)
);

-- ---------- RLS: mesmo padrão das tabelas do piloto ----------
do $$
declare t text;
begin
  foreach t in array array['produtos','informacoes_conta','analises','entregas_conta'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format($p$create policy isolamento_leitura on public.%I for select using (ax.pode_ver(tenant_id, client_id))$p$, t);
    execute format($p$create policy isolamento_escrita on public.%I for insert with check (ax.pode_ver(tenant_id, client_id))$p$, t);
    execute format($p$create policy isolamento_update on public.%I for update using (ax.pode_ver(tenant_id, client_id)) with check (ax.pode_ver(tenant_id, client_id))$p$, t);
  end loop;
end $$;

-- Produtos e informações são cadastrados por gente, não por agente.
drop policy isolamento_escrita on public.produtos;
create policy membro_cadastra on public.produtos for insert
  with check (ax.pode_ver(tenant_id, client_id) and ax.jwt_papel() = 'membro');
drop policy isolamento_escrita on public.informacoes_conta;
create policy membro_cadastra on public.informacoes_conta for insert
  with check (ax.pode_ver(tenant_id, client_id) and ax.jwt_papel() = 'membro');

-- ---------- Só membro aprova: trava no banco, não no prompt ----------
-- Vale para quem entra por JWT (agentes e membros). O backend com service_role e as
-- migrações já passam por fora da RLS e continuam podendo gravar.
create or replace function ax.via_jwt() returns boolean language sql stable as $$
  select current_user in ('authenticated', 'anon')
$$;

create or replace function ax.so_membro_aprova() returns trigger language plpgsql as $$
begin
  -- Análise aprovada fica congelada para agentes: mudar exige nova versão ou um membro.
  if ax.via_jwt() and tg_op = 'UPDATE' and old.estado = 'aprovada' and ax.jwt_papel() <> 'membro' then
    raise exception 'análise aprovada só muda por um membro' using errcode = '42501';
  end if;
  if new.estado = 'aprovada'
     and (tg_op = 'INSERT' or old.estado is distinct from 'aprovada')
     and ax.via_jwt() and ax.jwt_papel() <> 'membro' then
    raise exception 'só um membro da agência aprova' using errcode = '42501';
  end if;
  new.atualizado_em := now();
  return new;
end $$;

create or replace function ax.so_membro_aprova_entrega() returns trigger language plpgsql as $$
begin
  if new.estado = 'aprovada'
     and (tg_op = 'INSERT' or old.estado is distinct from 'aprovada')
     and ax.via_jwt() and ax.jwt_papel() <> 'membro' then
    raise exception 'só um membro da agência aprova' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger so_membro_aprova before insert or update on public.analises
  for each row execute function ax.so_membro_aprova();
create trigger so_membro_aprova before insert or update on public.entregas_conta
  for each row execute function ax.so_membro_aprova_entrega();

-- A entrega só pode citar análises aprovadas da mesma conta.
create or replace function ax.entrega_so_com_aprovadas() returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from unnest(new.analises) as a(id)
    left join public.analises x on x.id = a.id
    where x.id is null or x.client_id <> new.client_id or x.estado <> 'aprovada'
  ) then
    raise exception 'entrega cita análise de outra conta ou não aprovada' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger entrega_so_com_aprovadas before insert or update on public.entregas_conta
  for each row execute function ax.entrega_so_com_aprovadas();

-- Nenhuma policy de delete: exclusão de dados é sempre manual, com a Laura.
