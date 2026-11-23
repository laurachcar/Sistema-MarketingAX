import { describe, expect, it } from "vitest";
import { calcularIndicadores } from "../src/agentes/diagnostico-ax/metricas.js";

describe("indicadores calculados em código", () => {
  it("calcula razões e acha gargalo no meio do funil", () => {
    const i = calcularIndicadores({ canal: "instagram", periodo: "2026-10", alcance: 10000, interacoes: 500, impressoes: 20000, cliques: 400, leads: 4, vendas: 1 });
    expect(i.taxa_engajamento_alcance).toBe(0.05);
    expect(i.ctr).toBe(0.02);
    expect(i.conversao_clique_lead).toBe(0.01);
    expect(i.gargalo).toBe("meio");
  });
  it("sem dados não inventa número", () => {
    const i = calcularIndicadores({ canal: "site", periodo: "2026-10" });
    expect(i.ctr).toBeNull();
    expect(i.gargalo).toBe("sem_dados");
  });
  it("divisão por zero vira null", () => {
    expect(calcularIndicadores({ canal: "x", periodo: "p", cliques: 3, impressoes: 0 }).ctr).toBeNull();
  });
});
