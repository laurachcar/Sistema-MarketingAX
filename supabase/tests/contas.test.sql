-- Contas, análises e entregas: isolamento e portão de aprovação (pgTAP). Rodar com: supabase test db
begin;
select plan(8);

insert into public.tenants (id, nome) values ('00000000-0000-4000-8000-000000000001', 'AX');
insert into public.clientes (id, tenant_id, nome) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001', 'Cliente A'),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-000000000001', 'Cliente B');
insert into public.produtos (id, tenant_id, client_id, nome) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c1', 'Produto A'),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c2', 'Produto B');
insert into public.analises (id, tenant_id, client_id, categoria, subcategoria, catalogo_versao, estado) values
  ('00000000-0000-4000-8000-00000000aa01', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c1', 'negocio', 'swot', '1.0.0', 'aguardando_aprovacao'),
  ('00000000-0000-4000-8000-00000000bb01', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c2', 'negocio', 'swot', '1.0.0', 'aprovada');

-- Produto de outra conta não pode ser usado numa análise
select throws_ok(
  $$insert into public.analises (tenant_id, client_id, produto_id, categoria, subcategoria, catalogo_versao)
    values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-0000000000c1','00000000-0000-4000-8000-0000000000b1','branding','marca','1.0.0')$$,
  '23503', null, 'análise não aponta para produto de outra conta');

-- Agente do Cliente A
set local role authenticated;
set local request.jwt.claims to '{"tenant_id":"00000000-0000-4000-8000-000000000001","client_id":"00000000-0000-4000-8000-0000000000c1","ax_papel":"agente"}';

select is((select count(*)::int from public.analises), 1, 'agente do cliente A vê só as análises de A');
select is((select count(*)::int from public.produtos), 1, 'e só os produtos de A');
select throws_ok(
  $$update public.analises set estado = 'aprovada' where id = '00000000-0000-4000-8000-00000000aa01'$$,
  '42501', null, 'agente não aprova análise');
select throws_ok(
  $$insert into public.produtos (tenant_id, client_id, nome) values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-0000000000c1','Novo')$$,
  '42501', null, 'agente não cadastra produto');

-- Membro da agência
set local request.jwt.claims to '{"tenant_id":"00000000-0000-4000-8000-000000000001","ax_papel":"membro"}';

select lives_ok(
  $$update public.analises set estado = 'aprovada' where id = '00000000-0000-4000-8000-00000000aa01'$$,
  'membro aprova análise');
select throws_ok(
  $$insert into public.entregas_conta (tenant_id, client_id, tipo, versao, analises, conteudo)
    values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-0000000000c1','plano_de_marketing',1,
            array['00000000-0000-4000-8000-00000000bb01']::uuid[], '{}')$$,
  '23514', null, 'entrega não cita análise de outra conta');
select lives_ok(
  $$insert into public.entregas_conta (tenant_id, client_id, tipo, versao, analises, conteudo)
    values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-0000000000c1','plano_de_marketing',1,
            array['00000000-0000-4000-8000-00000000aa01']::uuid[], '{}')$$,
  'entrega com análise aprovada da mesma conta entra');

select * from finish();
rollback;
