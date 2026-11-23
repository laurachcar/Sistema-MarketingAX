-- Teste de vazamento entre clientes (pgTAP). Rodar com: supabase test db
begin;
select plan(4);

insert into public.tenants (id, nome) values ('00000000-0000-4000-8000-000000000001', 'AX');
insert into public.clientes (id, tenant_id, nome) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001', 'Cliente A'),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-000000000001', 'Cliente B');
insert into public.briefings (tenant_id, client_id, versao, respostas) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c1', 1, '{"cliente":"A"}'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c2', 1, '{"cliente":"B"}');

-- Agente do Cliente A
set local role authenticated;
set local request.jwt.claims to '{"tenant_id":"00000000-0000-4000-8000-000000000001","client_id":"00000000-0000-4000-8000-0000000000c1","ax_papel":"agente"}';

select is((select count(*)::int from public.briefings), 1, 'agente do cliente A vê só 1 briefing');
select is((select respostas->>'cliente' from public.briefings limit 1), 'A', 'e é o do cliente A');
select throws_ok(
  $$insert into public.briefings (tenant_id, client_id, versao, respostas)
    values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-0000000000c2', 2, '{}')$$,
  '42501', null, 'agente do cliente A não escreve no cliente B');
select throws_ok(
  $$insert into public.aprovacoes (tenant_id, client_id, portao, objeto_tipo, objeto_id, decisao, decidido_por)
    values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-0000000000c1','A','briefing',gen_random_uuid(),'aprovado','agente')$$,
  '42501', null, 'agente não consegue aprovar portão');

select * from finish();
rollback;
