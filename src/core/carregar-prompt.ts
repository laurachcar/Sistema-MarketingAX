import { readFileSync } from "node:fs";
import type { Papel } from "./config.js";

export interface PromptAgente {
  agente: string;
  versao: string;
  papel: Papel;
  texto: string;
}

/** Lê um prompt.md com frontmatter simples (agente, versao, modelo). */
export function carregarPrompt(caminho: string | URL): PromptAgente {
  const bruto = readFileSync(caminho, "utf8");
  const m = bruto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`prompt sem frontmatter: ${String(caminho)}`);
  const meta = Object.fromEntries(
    m[1]!.split("\n").map((l) => {
      const i = l.indexOf(":");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
  );
  if (!meta.agente || !meta.versao) throw new Error(`frontmatter incompleto: ${String(caminho)}`);
  return {
    agente: meta.agente,
    versao: meta.versao,
    papel: meta.modelo === "forte" ? "forte" : "padrao",
    texto: m[2]!.trim(),
  };
}
