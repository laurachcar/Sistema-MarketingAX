# Minicérebro: Estratégia de lançamento (categoria Plano de marketing)

Lido pelo `agente-lancamento`. A Laura e o Claude montam juntos o **modelo AX de lançamento**, e o agente adapta esse modelo a cada cliente e produto.

Volume esperado: 1 lançamento por conta por mês (cerca de 4 por mês hoje). Por ser pouco volume e muito impacto, este agente usa o modelo forte.

## As 5 fases da AX (fixas, nesta ordem)

| Fase | id | A preencher no modelo |
|---|---|---|
| Aquecimento de mercado | `aquecimento` | objetivo, duração típica, ações por canal, metas, sinais de que pode avançar |
| Pré-lançamento | `pre_lancamento` | idem |
| Lançamento | `lancamento` | idem |
| Sustentação | `sustentacao` | idem |
| Pós-lançamento | `pos_lancamento` | idem |

A ordem e as cinco fases são checadas em código (`fasesNaOrdem`), não só no prompt.

Falta (Laura + Claude):
- `modelo.md` (versão 1.0.0): o passo a passo de cada fase. Ponto de partida: o plano de lançamento do Femoflor, anonimizado.
- `exemplos/`: o plano do Femoflor anonimizado, sem nome da empresa nem dados pessoais.
- `rubrica.md`.
