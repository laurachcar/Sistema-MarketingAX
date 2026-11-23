import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { definicoes } from "../src/agentes/diagnostico-ax/agentes.js";

const raiz = new URL("../conhecimento/", import.meta.url).pathname;

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? arquivos(p) : [p];
  });
}

describe("conhecimento do minicérebro", () => {
  it("exemplos e regras não carregam identificadores de cliente (anonimização)", () => {
    const proibidos = [
      /biom[eé]dica/i, // nome do cliente de origem dos exemplos
      /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/, // CNPJ
      /\d{3}\.\d{3}\.\d{3}-\d{2}/, // CPF
      /\(?\d{2}\)?\s?9?\d{4}-\d{4}/, // telefone
      /@[\w.-]+\.(com|br)/i, // e-mail
    ];
    for (const f of arquivos(raiz)) {
      const t = readFileSync(f, "utf8");
      for (const r of proibidos) expect(t, `${f} contém ${r}`).not.toMatch(r);
    }
  });

  it("analistas, consolidador e avaliador recebem regras no minicérebro; avaliador recebe a rubrica", () => {
    const d = definicoes();
    for (const n of ["analista-mercado", "analista-marca", "analista-performance", "consolidador", "avaliador"] as const) {
      expect(d[n].prompt.texto).toContain("<conhecimento_ax>");
      expect(d[n].prompt.texto).not.toContain("TODO");
    }
    expect(d.avaliador.prompt.texto).toContain("Rubrica do Diagnóstico AX");
    expect(d["analista-mercado"].prompt.texto).toContain("<exemplo");
  });
});
