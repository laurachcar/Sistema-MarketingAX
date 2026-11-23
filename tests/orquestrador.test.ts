import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { definicoes, type DefinicaoAgente, type Executor, type NomeAgente } from "../src/agentes/diagnostico-ax/agentes.js";
import { afirmacoesDeFatoSemFonte, fase1Briefing, fase2Diagnostico, MAX_REFACOES } from "../src/agentes/diagnostico-ax/orquestrador.js";
import type { TAvaliacaoQA, TDiagnosticoParcial, TRelatorioDiagnostico, TSaidaBriefing } from "../src/agentes/diagnostico-ax/schemas.js";

const defs = definicoes();

const parcial = (area: TDiagnosticoParcial["area"]): TDiagnosticoParcial => ({
  area,
  resumo: "r",
  achados: [{ titulo: "t", impacto: "alto", afirmacoes: [{ texto: `fato ${area}`, fontes: ["F1"], natureza: "fato" }] }],
  oportunidades: [],
  riscos: [],
  fontes: [{ id: "F1", tipo: "briefing", descricao: "d", referencia: "r" }],
  limitacoes: [],
});

const relatorio = (comFonte = true): TRelatorioDiagnostico => ({
  cliente: "X",
  resumo_executivo: "r",
  mercado: parcial("mercado"),
  marca: parcial("marca"),
  performance: parcial("performance"),
  recomendacoes: [{ prioridade: 1, acao: "a", esforco: "baixo", impacto_esperado: "alto", prazo: "30_dias", metrica_de_sucesso: "m", porque: [{ texto: "porque sim", fontes: comFonte ? ["F1"] : [], natureza: "fato" }] }],
  lacunas_que_limitam: [],
  fontes: [],
});

const qa = (decisao: TAvaliacaoQA["decisao"]): TAvaliacaoQA => ({
  nota: decisao === "aprovado" ? 8 : 4, criterios: [], afirmacoes_sem_fonte: [], violacoes_de_regra: [], decisao, instrucoes_de_correcao: ["corrigir"],
});

function executorFalso(respostas: Partial<Record<NomeAgente, unknown[]>>) {
  const chamadas: NomeAgente[] = [];
  const exec: Executor = {
    async executar<T extends z.ZodType>(nome: NomeAgente, _d: DefinicaoAgente<T>): Promise<z.infer<T>> {
      chamadas.push(nome);
      const fila = respostas[nome]!;
      return (fila.length > 1 ? fila.shift() : fila[0]) as z.infer<T>;
    },
  };
  return { exec, chamadas };
}

const briefingVazio = (lacunaAlta: boolean, pronto: boolean): TSaidaBriefing =>
  ({
    briefing: {} as TSaidaBriefing["briefing"],
    lacunas: lacunaAlta ? [{ bloco: "objetivos", campo: "meta_12_meses", descricao: "", tipo: "ausente", risco: "alto", impacto: "", pergunta_de_aprofundamento: "" }] : [],
    alertas_de_seguranca: [],
    pronto_para_portao_a: pronto,
  });

describe("fase 1: briefing", () => {
  it("lacuna de risco alto segura o fluxo mesmo se o modelo disser que está pronto", async () => {
    const { exec } = executorFalso({ briefing: [briefingVazio(true, true)] });
    const r = await fase1Briefing(exec, defs, { nomeCliente: "X", formulario: "", materiais: [] });
    expect(r.estado).toBe("aguardando_respostas_do_cliente");
  });
  it("sem lacuna alta vai para o Portão A", async () => {
    const { exec } = executorFalso({ briefing: [briefingVazio(false, true)] });
    expect((await fase1Briefing(exec, defs, { nomeCliente: "X", formulario: "", materiais: [] })).estado).toBe("aguardando_portao_a");
  });
});

describe("fase 2: diagnóstico", () => {
  const entrada = { nomeCliente: "X", briefingAprovado: {} as never, metricas: [], dadosMercado: [], dadosMarca: [] };
  const analistas = { "analista-mercado": [parcial("mercado")], "analista-marca": [parcial("marca")], "analista-performance": [parcial("performance")] };

  it("aprovado pelo avaliador vai para o Portão B", async () => {
    const { exec } = executorFalso({ ...analistas, consolidador: [relatorio()], avaliador: [qa("aprovado")] });
    expect((await fase2Diagnostico(exec, defs, entrada)).estado).toBe("aguardando_portao_b");
  });

  it("afirmação sem fonte não passa nem se o avaliador aprovar", async () => {
    const { exec, chamadas } = executorFalso({ ...analistas, consolidador: [relatorio(false)], avaliador: [qa("aprovado")] });
    const r = await fase2Diagnostico(exec, defs, entrada);
    expect(r.estado).toBe("escalado_para_humano");
    expect(chamadas.filter((c) => c === "consolidador")).toHaveLength(MAX_REFACOES + 1);
  });

  it("para depois de 2 refações (sem loop infinito)", async () => {
    const { exec, chamadas } = executorFalso({ ...analistas, consolidador: [relatorio()], avaliador: [qa("refazer")] });
    const r = await fase2Diagnostico(exec, defs, entrada);
    expect(r.estado).toBe("escalado_para_humano");
    expect(chamadas.filter((c) => c === "avaliador")).toHaveLength(3);
  });

  it("detecta fonte citada que não existe", () => {
    const r = relatorio();
    r.recomendacoes[0]!.porque[0]!.fontes = ["F99"];
    expect(afirmacoesDeFatoSemFonte(r)).toEqual(["porque sim"]);
  });
});
