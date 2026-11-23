import { describe, expect, it } from "vitest";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AvaliacaoQA, DiagnosticoParcial, RelatorioDiagnostico, SaidaBriefing } from "../src/agentes/diagnostico-ax/schemas.js";
import { definicoes } from "../src/agentes/diagnostico-ax/agentes.js";

describe("esquemas e prompts", () => {
  it("todos os esquemas viram output_config.format válido", () => {
    for (const s of [SaidaBriefing, DiagnosticoParcial, RelatorioDiagnostico, AvaliacaoQA]) {
      expect(() => zodOutputFormat(s)).not.toThrow();
    }
  });
  it("todos os prompts carregam com versão e papel de modelo", () => {
    const d = definicoes();
    for (const [nome, def] of Object.entries(d)) {
      expect(def.prompt.agente).toBe(nome);
      expect(def.prompt.versao).toMatch(/^\d+\.\d+\.\d+$/);
    }
    expect(d.consolidador.prompt.papel).toBe("forte");
    expect(d.avaliador.prompt.papel).toBe("forte");
    expect(d.briefing.prompt.papel).toBe("padrao");
  });
});
