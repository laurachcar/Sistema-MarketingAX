import { readdirSync, readFileSync } from "node:fs";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { describe, expect, it } from "vitest";
import { CasoEvalEstrategia } from "../evals/estrategia/caso.js";
import { definicoesEstrategia } from "../src/agentes/estrategia/agentes.js";
import { FASES_LANCAMENTO, fasesNaOrdem, promocoesMarcadas, type TSaidaEstrategiasVenda } from "../src/agentes/estrategia/schemas.js";
import { CATEGORIAS } from "../src/estrategia/catalogo.js";

describe("agentes das categorias estratégicas", () => {
  const defs = definicoesEstrategia();

  it("prompts carregam com versão, papel de modelo e as seções obrigatórias", () => {
    for (const [nome, def] of Object.entries(defs)) {
      expect(def.prompt.agente).toBe(nome);
      expect(def.prompt.versao).toMatch(/^\d+\.\d+\.\d+$/);
      for (const tag of ["<papel>", "<regras>", "<seguranca>", "<saida>"]) expect(def.prompt.texto).toContain(tag);
      expect(def.prompt.texto).not.toMatch(/\$\{|\$[A-Z]{3}/);
    }
    expect(defs["agente-lancamento"].prompt.papel).toBe("forte");
    expect(defs["agente-infraestrutura"].prompt.papel).toBe("padrao");
  });

  it("esquemas viram output_config.format válido", () => {
    for (const def of Object.values(defs)) expect(() => zodOutputFormat(def.esquema)).not.toThrow();
  });

  it("toda subcategoria do catálogo tem quem execute", () => {
    const semDono = CATEGORIAS.flatMap((c) => c.subcategorias).filter((s) => s.executor === null);
    expect(semDono.map((s) => s.id)).toEqual([]);
  });
});

describe("checagens em código", () => {
  const fase = (f: (typeof FASES_LANCAMENTO)[number]) => ({ fase: f, objetivo: "", duracao_sugerida: "", acoes: [], metas: [], riscos: [] });

  it("lançamento exige as 5 fases na ordem da AX", () => {
    expect(fasesNaOrdem({ fases: FASES_LANCAMENTO.map(fase) })).toBe(true);
    expect(fasesNaOrdem({ fases: FASES_LANCAMENTO.slice(1).map(fase) })).toBe(false);
    expect(fasesNaOrdem({ fases: [...FASES_LANCAMENTO].reverse().map(fase) })).toBe(false);
  });

  it("promoção sem aprovação comercial é barrada", () => {
    const rec = (ok: boolean) => ({ acao: "", etapa_da_jornada: "acao" as const, lente: "ambas" as const, porque: [], esforco: "baixo" as const, impacto: "medio" as const, precisa_aprovacao_comercial: ok });
    const saida = (ok: boolean): TSaidaEstrategiasVenda => ({ produto: null, itens: [{ item: "promocoes", diagnostico: [], recomendacoes: [rec(ok)] }], fontes: [], limitacoes: [], alertas_de_seguranca: [] });
    expect(promocoesMarcadas(saida(true))).toBe(true);
    expect(promocoesMarcadas(saida(false))).toBe(false);
  });
});

describe("casos de eval das estratégias", () => {
  const dir = new URL("../evals/estrategia/casos/", import.meta.url);
  const arquivos = readdirSync(dir).filter((f) => f.endsWith(".json"));
  it("cada agente novo tem pelo menos um caso", () => {
    const agentes = new Set(arquivos.map((f) => CasoEvalEstrategia.parse(JSON.parse(readFileSync(new URL(f, dir), "utf8"))).agente));
    expect(agentes.size).toBe(5);
  });
  for (const f of arquivos) {
    it(`${f} é válido`, () => {
      expect(() => CasoEvalEstrategia.parse(JSON.parse(readFileSync(new URL(f, dir), "utf8")))).not.toThrow();
    });
  }
});
