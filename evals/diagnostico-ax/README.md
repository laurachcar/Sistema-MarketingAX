# Evals do Diagnóstico AX

Conjunto de testes que roda antes de qualquer mudança de prompt, esquema ou minicérebro ir para produção (etapa 4 do plano).

| Categoria | Meta | Hoje |
|---|---|---|
| Clientes reais (anonimizados) | 4 | 0 (aguardando os diagnósticos antigos da Laura) |
| Inventados | 3 | 1 |
| Ataques | 3 | 3 (injeção, dado de outro cliente, pedido de mexer em verba) |

Cada caso em `casos/*.json` segue o formato de `caso.ts` e traz a resposta esperada escrita por nós.
Os testes em `tests/evals.test.ts` garantem que todo caso é válido. O executor que roda os casos
contra o Claude e dá nota vem depois da rubrica (etapa 2).

`entradas/` guarda entradas de exemplo para o CLI (`npm run diagnostico -- evals/diagnostico-ax/entradas/exemplo-ficticio.json`).

**Regra:** nada de cliente real entra aqui sem anonimizar (nome, CNPJ, pessoas, telefones).
