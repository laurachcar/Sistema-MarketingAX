import { z } from "zod";
import { Afirmacao, Fonte } from "../diagnostico-ax/schemas.js";

/**
 * Contratos de saída dos agentes das categorias estratégicas que ainda não tinham dono:
 * Infraestrutura (Negócio), Lançamento (Plano de marketing) e os três de Vendas.
 * Mesma regra do Diagnóstico: fato aponta para fonte; sem fonte é inferência ou hipótese.
 */

const Prioridade = z.enum(["alta", "media", "baixa"]);
const Nivel = z.enum(["baixo", "medio", "alto"]);

const Comum = {
  fontes: z.array(Fonte),
  limitacoes: z.array(z.string()).describe("O que não deu para analisar e por quê"),
  alertas_de_seguranca: z
    .array(z.string())
    .describe("Instruções suspeitas nos dados, dado de outro cliente, dado pessoal de terceiros, pedido fora do escopo"),
};

// ---------- Infraestrutura (Negócio) ----------
export const TipoItemInfra = z.enum([
  "agente",
  "pop",
  "procedimento",
  "playbook",
  "material_de_apoio",
  "ferramenta",
  "papel_na_equipe",
  "outro",
]);

export const SaidaInfraestrutura = z.object({
  resumo: z.string(),
  itens: z.array(
    z.object({
      tipo: TipoItemInfra,
      nome: z.string(),
      para_que: z.string().describe("Qual objetivo ou análise da conta este item sustenta"),
      situacao: z.enum(["existe", "parcial", "nao_existe", "nao_informado"]),
      evidencia: z.array(Afirmacao),
    }),
  ),
  lacunas: z.array(
    z.object({
      item: z.string(),
      tipo: TipoItemInfra,
      impacto: z.string().describe("O que deixa de acontecer sem este item"),
      prioridade: Prioridade,
      depende_de: z.array(z.string()).describe("Outros itens que precisam vir antes"),
    }),
  ),
  ...Comum,
});

// ---------- Lançamento (Plano de marketing, por produto) ----------
export const FASES_LANCAMENTO = ["aquecimento", "pre_lancamento", "lancamento", "sustentacao", "pos_lancamento"] as const;
export const FaseLancamento = z.enum(FASES_LANCAMENTO);

export const SaidaLancamento = z.object({
  produto: z.string(),
  modelo_base_versao: z.string().describe("Versão do modelo AX de lançamento usado como ponto de partida"),
  adaptacoes: z
    .array(z.object({ o_que_mudou: z.string(), porque: z.array(Afirmacao) }))
    .describe("Onde o plano se afasta do modelo AX e por quê"),
  fases: z.array(
    z.object({
      fase: FaseLancamento,
      objetivo: z.string(),
      duracao_sugerida: z.string().describe("Ex.: 3 semanas"),
      acoes: z.array(
        z.object({ acao: z.string(), canal: z.string(), publico: z.string(), responsavel_sugerido: z.string() }),
      ),
      metas: z.array(
        z.object({
          indicador: z.string(),
          meta: z.string().nullable().describe("null quando não há base para estimar"),
          base: z.array(Afirmacao),
        }),
      ),
      riscos: z.array(z.string()),
    }),
  ),
  alertas_regulatorios: z.array(z.string()).describe("Claims, registros e regras do setor que o plano precisa respeitar"),
  ...Comum,
});

/** Código antes de LLM: as 5 fases da AX, cada uma uma vez, nesta ordem. */
export function fasesNaOrdem(saida: Pick<z.infer<typeof SaidaLancamento>, "fases">): boolean {
  const f = saida.fases.map((x) => x.fase);
  return f.length === FASES_LANCAMENTO.length && f.every((x, i) => x === FASES_LANCAMENTO[i]);
}

// ---------- Vendas: Key accounts ----------
export const SaidaKeyAccounts = z.object({
  criterios_de_selecao: z.array(z.string()),
  contas: z.array(
    z.object({
      conta: z.string().describe("Nome da empresa-alvo, nunca de uma pessoa"),
      porque: z.array(Afirmacao),
      potencial: Nivel,
      decisores: z
        .array(z.object({ papel: z.string(), influencia: Nivel, dor_principal: z.string() }))
        .describe("Só cargos e papéis. Nome, telefone, e-mail ou CPF de pessoas nunca entram"),
      plano: z.array(z.string()).describe("Ações de ABM para esta conta"),
      proximo_passo: z.string(),
    }),
  ),
  ...Comum,
});

// ---------- Vendas: Processos ----------
export const SaidaProcessosVendas = z.object({
  resumo: z.string(),
  etapas_do_funil: z.array(
    z.object({
      etapa: z.string(),
      criterio_de_entrada: z.string(),
      responsavel: z.string(),
      sla: z.string().nullable(),
      metrica: z.string(),
      situacao: z.enum(["funciona", "fragil", "nao_existe", "nao_informado"]),
      evidencia: z.array(Afirmacao),
    }),
  ),
  passagem_marketing_vendas: z.object({
    definicao_de_lead_qualificado: z.string().nullable(),
    sla: z.string().nullable(),
    retorno_de_vendas_para_marketing: z.string().nullable(),
  }),
  uso_do_crm: z.object({
    ferramenta: z.string().nullable(),
    o_que_registrar: z.array(z.string()),
    lacunas: z.array(z.string()),
  }),
  recomendacoes: z.array(
    z.object({ acao: z.string(), porque: z.array(Afirmacao), esforco: Nivel, impacto: Nivel }),
  ),
  ...Comum,
});

// ---------- Vendas: Estratégias de venda ----------
export const ItemEstrategiaVenda = z.enum([
  "cx",
  "jornada_de_compra",
  "promocoes",
  "tecnicas_de_venda",
  "materiais_de_apoio",
  "geracao_de_leads",
]);
export const EtapaJornada = z.enum(["assimilacao", "atracao", "arguicao", "acao", "apologia"]);

export const SaidaEstrategiasVenda = z.object({
  produto: z.string().nullable().describe("null = estratégia geral da conta"),
  itens: z.array(
    z.object({
      item: ItemEstrategiaVenda,
      diagnostico: z.array(Afirmacao),
      recomendacoes: z.array(
        z.object({
          acao: z.string(),
          etapa_da_jornada: EtapaJornada,
          lente: z.enum(["gestor_financeiro", "assessor_cientifico", "ambas", "nao_se_aplica"]),
          porque: z.array(Afirmacao),
          esforco: Nivel,
          impacto: Nivel,
          precisa_aprovacao_comercial: z
            .boolean()
            .describe("true para preço, desconto, condição ou promoção: é sugestão, quem decide é o cliente"),
        }),
      ),
    }),
  ),
  ...Comum,
});

/** Código antes de LLM: promoção, preço e desconto sempre exigem aprovação comercial. */
export function promocoesMarcadas(saida: z.infer<typeof SaidaEstrategiasVenda>): boolean {
  return saida.itens
    .filter((i) => i.item === "promocoes")
    .every((i) => i.recomendacoes.every((r) => r.precisa_aprovacao_comercial));
}

export type TSaidaInfraestrutura = z.infer<typeof SaidaInfraestrutura>;
export type TSaidaLancamento = z.infer<typeof SaidaLancamento>;
export type TSaidaKeyAccounts = z.infer<typeof SaidaKeyAccounts>;
export type TSaidaProcessosVendas = z.infer<typeof SaidaProcessosVendas>;
export type TSaidaEstrategiasVenda = z.infer<typeof SaidaEstrategiasVenda>;
