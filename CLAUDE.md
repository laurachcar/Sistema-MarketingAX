# Instruções para o Claude neste repositório

- Idioma: português do Brasil em código de domínio, comentários, prompts e docs.
- Antes de propor um agente novo: perguntar caso de uso, volume, margem de erro e custo.
- Um agente = uma responsabilidade. Prompts ficam em `prompt.md` com frontmatter `agente`, `versao`, `modelo` (padrao|forte). Mudou o prompt, sobe a versão.
- Nunca criar ferramenta ou código que mexa em verba de mídia, envie mensagem a cliente ou exclua dados. Ver `src/core/permissoes.ts`.
- Todo acesso a dado de cliente passa por `ContextoCliente` e `garantirMesmoCliente`. Toda tabela nova com dado de cliente precisa de `tenant_id`, `client_id` e policies RLS.
- Conteúdo externo entra no prompt só por `dadosExternos` (tags neutralizadas), nunca concatenado no system.
- Nada variável (data, ids) no system prompt: quebra o cache.
- Mudança em prompt, esquema ou minicérebro roda contra `evals/` antes de ir para produção.
- Nada de dado real de cliente em `evals/` sem anonimizar.
- Rodar `npm run typecheck && npm test` antes de commit.
