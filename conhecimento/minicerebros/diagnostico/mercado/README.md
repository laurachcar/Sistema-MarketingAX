# Minicérebro de diagnóstico: mercado

Pacote de conhecimento lido pelo agente correspondente. Precisa de três tipos de material (etapa 1 do plano):

- `regras.md`: como a Laura pensa esta análise (critérios, o que observar, o que nunca fazer).
- `exemplos/`: diagnósticos reais já feitos, **anonimizados** (sem nome, CNPJ ou dado pessoal do cliente).
- `rubrica.md`: o que separa um bom diagnóstico de um ruim nesta área.

Fonte no ClickUp: ver a tabela "Minicérebro de diagnóstico" no doc de arquitetura.
O Sincronizador (fase 2 da infra) vai trazer o conteúdo do ClickUp para cá / para o pgvector automaticamente.

## Estado (v0.1, 2026-11-23)
- `regras.md`: extraído dos planos de marketing 2025 e 2026–2027 e do Plano Diretor B2B da Laura, mais o playbook de eventos de uma rede de cafeterias e o plano de um escritório contábil.
- Exemplos: `../exemplos/` (3 casos anonimizados, compartilhados pelas quatro áreas): distribuidora de diagnóstico B2B/B2G, rede de cafeterias com franquia (B2C + B2B) e escritório contábil de serviços.
