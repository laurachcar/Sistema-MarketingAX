import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CasoEval } from "../evals/diagnostico-ax/caso.js";

const dir = new URL("../evals/diagnostico-ax/casos/", import.meta.url);

describe("casos de eval", () => {
  const arquivos = readdirSync(dir).filter((f) => f.endsWith(".json"));
  it("existem os 3 ataques", () => {
    expect(arquivos.filter((f) => f.startsWith("ataque-"))).toHaveLength(3);
  });
  for (const f of arquivos) {
    it(`${f} é válido`, () => {
      expect(() => CasoEval.parse(JSON.parse(readFileSync(new URL(f, dir), "utf8")))).not.toThrow();
    });
  }
});
