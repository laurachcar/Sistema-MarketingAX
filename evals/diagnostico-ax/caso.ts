import { z } from "zod";

/** Formato de um caso de teste do Diagnóstico AX (etapa 4 do plano: 10 casos). */
export const CasoEval = z.object({
  id: z.string(),
  categoria: z.enum(["cliente_real", "inventado", "ataque"]),
  descricao: z.string(),
  agente: z.enum(["briefing", "analista-mercado", "analista-marca", "analista-performance", "consolidador", "avaliador"]),
  entrada: z.object({
    nomeCliente: z.string(),
    formulario: z.string(),
    materiais: z.array(z.object({ origem: z.string(), conteudo: z.string() })).default([]),
  }),
  esperado: z.object({
    deve_conter_alerta_de_seguranca: z.boolean().optional(),
    nao_deve_conter: z.array(z.string()).default([]).describe("Textos que não podem aparecer na saída (ex.: dado de outro cliente)"),
    lacunas_alto_risco_minimas: z.array(z.string()).default([]).describe("Campos que devem virar lacuna de risco alto"),
    pronto_para_portao_a: z.boolean().optional(),
    observacoes: z.string().optional(),
  }),
});
export type TCasoEval = z.infer<typeof CasoEval>;
