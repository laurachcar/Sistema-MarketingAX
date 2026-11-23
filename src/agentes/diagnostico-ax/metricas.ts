/**
 * Analista de Performance, parte "código calcula": números saem daqui, não do modelo.
 * O LLM só interpreta o resultado. Isso reduz custo e elimina conta errada.
 */

export interface MetricaCanal {
  canal: string;
  periodo: string; // ex.: 2026-10
  seguidores?: number;
  alcance?: number;
  impressoes?: number;
  interacoes?: number;
  cliques?: number;
  leads?: number;
  vendas?: number;
}

export interface IndicadoresCanal {
  canal: string;
  periodo: string;
  taxa_engajamento_alcance: number | null; // interações / alcance
  ctr: number | null; // cliques / impressões
  conversao_clique_lead: number | null; // leads / cliques
  conversao_lead_venda: number | null; // vendas / leads
  gargalo: "topo" | "meio" | "fundo" | "sem_gargalo" | "sem_dados";
}

const razao = (a?: number, b?: number): number | null =>
  a === undefined || b === undefined || b === 0 ? null : Number((a / b).toFixed(4));

/**
 * Faixas provisórias. TODO (etapa 1): substituir pelas faixas que a Laura considera boas ou ruins por canal.
 */
export const FAIXAS_MINIMAS = { taxa_engajamento_alcance: 0.02, ctr: 0.008, conversao_clique_lead: 0.03, conversao_lead_venda: 0.05 };

export function calcularIndicadores(m: MetricaCanal): IndicadoresCanal {
  const i = {
    taxa_engajamento_alcance: razao(m.interacoes, m.alcance),
    ctr: razao(m.cliques, m.impressoes),
    conversao_clique_lead: razao(m.leads, m.cliques),
    conversao_lead_venda: razao(m.vendas, m.leads),
  };
  let gargalo: IndicadoresCanal["gargalo"] = "sem_dados";
  if (i.taxa_engajamento_alcance !== null && i.taxa_engajamento_alcance < FAIXAS_MINIMAS.taxa_engajamento_alcance) gargalo = "topo";
  else if (i.ctr !== null && i.ctr < FAIXAS_MINIMAS.ctr) gargalo = "topo";
  else if (i.conversao_clique_lead !== null && i.conversao_clique_lead < FAIXAS_MINIMAS.conversao_clique_lead) gargalo = "meio";
  else if (i.conversao_lead_venda !== null && i.conversao_lead_venda < FAIXAS_MINIMAS.conversao_lead_venda) gargalo = "fundo";
  else if (Object.values(i).some((v) => v !== null)) gargalo = "sem_gargalo";
  return { canal: m.canal, periodo: m.periodo, ...i, gargalo };
}
