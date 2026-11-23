import { describe, expect, it } from "vitest";
import { ACOES_BLOQUEADAS, ACOES_PERMITIDAS, acaoPermitida } from "../src/core/permissoes.js";

describe("permissões dos agentes", () => {
  it("verba e mensagem ao cliente nunca são permitidas", () => {
    for (const a of ACOES_BLOQUEADAS) expect(acaoPermitida(a)).toBe(false);
  });
  it("as listas não se sobrepõem", () => {
    const p = new Set<string>(ACOES_PERMITIDAS);
    expect(ACOES_BLOQUEADAS.filter((a) => p.has(a))).toEqual([]);
  });
});
