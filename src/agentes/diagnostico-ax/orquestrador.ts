import type { DadoExterno } from "../../core/prompt.js";
import type { Definicoes, Executor } from "./agentes.js";
import { calcularIndicadores, type MetricaCanal } from "./metricas.js";
import type {
  TAvaliacaoQA,
  TBriefing,
  TDiagnosticoParcial,
  TRelatorioDiagnostico,
  TSaidaBriefing,
} from "./schemas.js";

/**
 * Diagnóstico AX: pipeline fixo (workflow determinístico), não um agente livre.
 *
 *   Fase 1: Briefing ─────────────────────────────► Portão A (Laura aprova o briefing)
 *   Fase 2: 3 analistas em paralelo → Consolidador → Avaliador (até 2 refações) ─► Portão B
 *
 * Os portões são humanos: o orquestrador para e devolve o estado. Quem retoma é o
 * Gestor de Aprovações, com o briefing já aprovado.
 */

export const MAX_REFACOES = 2;

export interface EntradaFase1 {
  nomeCliente: string;
  formulario: string; // respostas do formulário, em texto ou JSON serializado
  materiais: DadoExterno[];
}

export type ResultadoFase1 =
  | { estado: "aguardando_portao_a"; saida: TSaidaBriefing }
  | { estado: "aguardando_respostas_do_cliente"; saida: TSaidaBriefing };

export async function fase1Briefing(exec: Executor, defs: Definicoes, e: EntradaFase1): Promise<ResultadoFase1> {
  const saida = await exec.executar("briefing", defs.briefing, {
    dadosExternos: [{ origem: "formulario_briefing", conteudo: e.formulario }, ...e.materiais],
    pedido: `Monte o briefing estruturado do cliente "${e.nomeCliente}" e liste as lacunas.`,
  });
  // A decisão de parar é do código, não do modelo: lacuna de risco alto sempre segura o fluxo.
  const temLacunaAlta = saida.lacunas.some((l) => l.risco === "alto");
  return {
    estado: temLacunaAlta || !saida.pronto_para_portao_a ? "aguardando_respostas_do_cliente" : "aguardando_portao_a",
    saida,
  };
}

export interface EntradaFase2 {
  nomeCliente: string;
  briefingAprovado: TBriefing; // só chega aqui depois do Portão A
  metricas: MetricaCanal[];
  dadosMercado: DadoExterno[];
  dadosMarca: DadoExterno[];
}

export type ResultadoFase2 =
  | { estado: "aguardando_portao_b"; relatorio: TRelatorioDiagnostico; avaliacoes: TAvaliacaoQA[] }
  | { estado: "escalado_para_humano"; relatorio: TRelatorioDiagnostico; avaliacoes: TAvaliacaoQA[]; motivo: string };

export async function fase2Diagnostico(exec: Executor, defs: Definicoes, e: EntradaFase2): Promise<ResultadoFase2> {
  const resumoCliente = `Cliente: ${e.nomeCliente}\nBriefing aprovado (JSON):\n${JSON.stringify(e.briefingAprovado)}`;
  const indicadores = e.metricas.map(calcularIndicadores);

  const [mercado, marca, performance] = await Promise.all([
    exec.executar("analista-mercado", defs["analista-mercado"], {
      resumoCliente,
      dadosExternos: e.dadosMercado,
      pedido: "Faça o diagnóstico de mercado e concorrência.",
    }),
    exec.executar("analista-marca", defs["analista-marca"], {
      resumoCliente,
      dadosExternos: e.dadosMarca,
      pedido: "Faça o diagnóstico de marca e público.",
    }),
    exec.executar("analista-performance", defs["analista-performance"], {
      resumoCliente,
      dadosExternos: [
        { origem: "metricas_brutas", conteudo: JSON.stringify(e.metricas) },
        { origem: "indicadores_calculados", conteudo: JSON.stringify(indicadores) },
      ],
      pedido: "Interprete os indicadores já calculados (não recalcule) e aponte o gargalo do funil.",
    }),
  ]);

  const parciais: TDiagnosticoParcial[] = [mercado, marca, performance];
  const avaliacoes: TAvaliacaoQA[] = [];
  let correcoes: string[] = [];
  let relatorio!: TRelatorioDiagnostico;

  for (let tentativa = 0; tentativa <= MAX_REFACOES; tentativa++) {
    relatorio = await exec.executar("consolidador", defs.consolidador, {
      resumoCliente,
      dadosExternos: parciais.map((p) => ({ origem: `diagnostico_${p.area}`, conteudo: JSON.stringify(p) })),
      pedido: correcoes.length
        ? `Refaça o relatório corrigindo:\n- ${correcoes.join("\n- ")}`
        : "Consolide os três diagnósticos em um relatório priorizado.",
    });

    const qa = await exec.executar("avaliador", defs.avaliador, {
      resumoCliente,
      dadosExternos: [{ origem: "relatorio_para_avaliar", conteudo: JSON.stringify(relatorio) }],
      pedido: "Avalie o relatório com a rubrica.",
    });
    avaliacoes.push(qa);

    // Trava de código por cima do julgamento do modelo: afirmação sem fonte nunca passa.
    const semFonte = afirmacoesDeFatoSemFonte(relatorio);
    if (qa.decisao === "aprovado" && semFonte.length === 0) {
      return { estado: "aguardando_portao_b", relatorio, avaliacoes };
    }
    if (qa.decisao === "escalar_humano") {
      return { estado: "escalado_para_humano", relatorio, avaliacoes, motivo: "Avaliador pediu revisão humana" };
    }
    correcoes = [...qa.instrucoes_de_correcao, ...semFonte.map((t) => `Afirmação de fato sem fonte: "${t}"`)];
  }

  return {
    estado: "escalado_para_humano",
    relatorio,
    avaliacoes,
    motivo: `Reprovado após ${MAX_REFACOES} refações`,
  };
}

/** Confere, em código, que toda afirmação "fato" cita uma fonte que existe no relatório. */
export function afirmacoesDeFatoSemFonte(r: TRelatorioDiagnostico): string[] {
  const ids = new Set([...r.fontes, ...r.mercado.fontes, ...r.marca.fontes, ...r.performance.fontes].map((f) => f.id));
  const todas = [
    ...[r.mercado, r.marca, r.performance].flatMap((p) => p.achados.flatMap((a) => a.afirmacoes)),
    ...r.recomendacoes.flatMap((rec) => rec.porque),
  ];
  return todas
    .filter((a) => a.natureza === "fato" && (a.fontes.length === 0 || a.fontes.some((f) => !ids.has(f))))
    .map((a) => a.texto);
}
