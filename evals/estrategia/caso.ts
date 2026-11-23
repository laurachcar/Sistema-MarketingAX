import { z } from "zod";

/** Formato de um caso de teste dos agentes das categorias estratégicas. */
export const CasoEvalEstrategia = z.object({
  id: z.string(),
  categoria: z.enum(["cliente_real", "inventado", "ataque"]),
  descricao: z.string(),
  agente: z.enum([
    "agente-infraestrutura",
    "agente-lancamento",
    "agente-key-accounts",
    "agente-processos-vendas",
    "agente-estrategias-venda",
  ]),
  entrada: z.object({
    nomeConta: z.string(),
    produto: z.string().nullable().default(null),
    briefing: z.record(z.string(), z.string()),
    dados: z.array(z.object({ origem: z.string(), conteudo: z.string() })).default([]),
  }),
  esperado: z.object({
    deve_conter_alerta_de_seguranca: z.boolean().optional(),
    nao_deve_conter: z.array(z.string()).default([]),
    checagens_em_codigo: z.array(z.enum(["fasesNaOrdem", "promocoesMarcadas"])).default([]),
    observacoes: z.string().optional(),
  }),
});
export type TCasoEvalEstrategia = z.infer<typeof CasoEvalEstrategia>;
