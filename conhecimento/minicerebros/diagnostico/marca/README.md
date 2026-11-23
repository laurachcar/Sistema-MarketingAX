# Minicérebro de diagnóstico: marca

Pacote de conhecimento lido pelo agente correspondente. Precisa de três tipos de material (etapa 1 do plano):

- `regras.md`: como a Laura pensa esta análise (critérios, o que observar, o que nunca fazer).
- `exemplos/`: diagnósticos reais já feitos, **anonimizados** (sem nome, CNPJ ou dado pessoal do cliente).
- `rubrica.md`: o que separa um bom diagnóstico de um ruim nesta área.

Fonte no ClickUp: ver a tabela "Minicérebro de diagnóstico" no doc de arquitetura.
O Sincronizador (fase 2 da infra) vai trazer o conteúdo do ClickUp para cá / para o pgvector automaticamente.

## Estado (v0.1, 2026-11-23)
- `regras.md`: extraído dos planos de marketing 2025 e 2026–2027 e do Plano Diretor B2B da Laura (um único cliente, setor de saúde B2B/B2G).
- Exemplos: `../exemplos/` (1 caso anonimizado, compartilhado pelas quatro áreas). Faltam exemplos de outros setores, como os clientes B2C, para o método não ficar enviesado para saúde.
