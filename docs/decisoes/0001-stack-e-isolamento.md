# 0001 — Stack de custo mínimo e isolamento por RLS

Data: 2026-11-23 · Estado: aceita

## Contexto
4 clientes hoje, 30 em 12 meses; orçamento mínimo; construído pela Laura com o Claude. Vazamento entre clientes e verba errada são inaceitáveis. O produto deve poder virar SaaS para outras agências.

## Decisão
- **TypeScript + SDK oficial da Anthropic**, código próprio, sem framework de agentes.
- **Supabase** (Postgres + RLS + pgvector) como banco, busca vetorial e isolamento em um serviço só.
- `tenant_id` desde o dia 1, para o SaaS não exigir refazer o modelo de dados.
- Saída de todo agente validada por esquema Zod → JSON Schema (`output_config.format`).
- Modelo barato por padrão; forte só no Estrategista e no Avaliador. Configurável por variável de ambiente.
- Make só onde faltar API; APIs nativas das plataformas só leitura.

## Consequências
- Precisamos assinar JWTs de agente com o `client_id` no backend (próximo passo de infra).
- Sem framework, o orquestrador é simples e auditável, mas cada novo fluxo é código nosso.
