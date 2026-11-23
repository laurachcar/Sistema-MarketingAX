# Sistema AX

Plataforma multicliente de agentes de marketing da **AX Marketing**. Cada cliente tem conta, briefing, análises, aprovações e agentes executores, e cada tipo de ação tem um *minicérebro* com o método da AX que aprende com as aprovações.

> Estado: **piloto Diagnóstico AX, esqueleto v0.1**. Os prompts dos analistas e a rubrica ainda esperam o conhecimento da Laura (etapas 1 e 2 do plano).

## Princípios de arquitetura

- **Pipeline fixo onde as etapas são conhecidas**, agente só onde há julgamento. Sem enxame de agentes conversando livremente.
- **Responsabilidade única** por agente; agentes não falam entre si, tudo passa pelo orquestrador.
- **Isolamento entre clientes é trava de código e de banco**, não de prompt: `tenant_id` + `client_id` em todo registro, Row-Level Security no Supabase e checagem no código.
- **Ações proibidas não existem como ferramenta**: nenhum agente mexe em verba nem fala com o cliente.
- **Código antes de LLM**: coleta, cálculo de métricas e checagem de fontes são código.
- **Custo mínimo**: modelo barato por padrão (forte só no Estrategista e no Avaliador), prompt em camadas com cache, lote para o que não é tempo real.
- **Humano nos portões**: o sistema para e espera a Laura aprovar briefing (Portão A) e diagnóstico (Portão B).

Documento completo: [docs/arquitetura.md](docs/arquitetura.md).

## Estrutura

```
src/
  core/                      núcleo compartilhado por todos os agentes
    tenant.ts                contexto do cliente e trava de isolamento
    permissoes.ts            ações permitidas e bloqueadas
    prompt.ts                montagem em camadas (Método → minicérebro → cliente → RAG → pedido) com cache
    llm.ts                   chamada ao Claude com saída validada por esquema e log de custo
    registro.ts              log de execução (tokens, cache, duração)
  agentes/
    diagnostico-ax/          piloto
      orquestrador.ts        fase 1 (briefing → Portão A) e fase 2 (3 analistas → consolidador ⇄ avaliador → Portão B)
      schemas.ts             contratos JSON de entrada e saída
      metricas.ts            indicadores de funil calculados em código
      briefing/ analista-*/ consolidador/ avaliador/   um prompt.md versionado por agente
      cli.ts                 roda a fase 1 a partir de um JSON
  coletores/                 (fase seguinte) leitura de redes, site e mídia, só leitura
conhecimento/
  metodo-ax/                 camada 1: Método AX global
  minicerebros/diagnostico/  camada 2: regras, exemplos e rubrica por área
supabase/
  migrations/                esquema + RLS
  tests/                     teste de vazamento entre clientes (pgTAP)
evals/diagnostico-ax/        casos de teste (reais anonimizados, inventados, ataques)
tests/                       testes unitários (vitest)
docs/                        arquitetura e decisões
```

## Como rodar

```bash
npm install
cp .env.example .env              # preencha ANTHROPIC_API_KEY
npm run typecheck
npm test

# Mostra o prompt montado do Agente de Briefing, sem custo:
npm run diagnostico -- evals/diagnostico-ax/entradas/exemplo-ficticio.json
# Executa de verdade (custa tokens):
npm run diagnostico -- evals/diagnostico-ax/entradas/exemplo-ficticio.json --executar
```

Banco: `supabase db reset` aplica a migração e `supabase test db` roda o teste de isolamento (requer a CLI do Supabase).

## Próximos passos do piloto

1. Laura: marcar no ClickUp os tópicos "pronto para o cérebro" e separar 3 a 5 diagnósticos antigos.
2. Laura + Claude: rubrica do diagnóstico (6 a 10 critérios com peso).
3. Preencher os prompts dos analistas e do consolidador com os pacotes de conhecimento.
4. Completar os 10 casos de eval e o executor de evals.
5. Coletor de redes do Mula (só leitura) e persistência no Supabase.
6. Rodar no Mula e comparar com o diagnóstico manual.
