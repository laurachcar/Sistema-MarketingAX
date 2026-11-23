import { readdirSync, readFileSync } from "node:fs";
import type { z } from "zod";
import { carregarPrompt, type PromptAgente } from "../../core/carregar-prompt.js";
import type { CamadasPrompt } from "../../core/prompt.js";
import {
  AvaliacaoQA,
  DiagnosticoParcial,
  RelatorioDiagnostico,
  SaidaBriefing,
} from "./schemas.js";

const aqui = (rel: string) => new URL(rel, import.meta.url);
const MINICEREBRO = new URL("../../../conhecimento/minicerebros/diagnostico/", import.meta.url);

const ler = (rel: string) => readFileSync(new URL(rel, MINICEREBRO), "utf8").trim();

function exemplos(): string {
  const dir = new URL("exemplos/", MINICEREBRO);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => `<exemplo arquivo="${f}">\n${readFileSync(new URL(f, dir), "utf8").trim()}\n</exemplo>`)
    .join("\n");
}

/**
 * Camada 2 (minicérebro): instruções do prompt.md + regras da área + exemplos anonimizados (+ rubrica no avaliador).
 * Tudo estável entre clientes, então fica no bloco em cache.
 */
function comConhecimento(p: PromptAgente, partes: string[]): PromptAgente {
  return { ...p, texto: `${p.texto}\n\n<conhecimento_ax>\n${partes.join("\n\n")}\n</conhecimento_ax>` };
}

export type NomeAgente =
  | "briefing"
  | "analista-mercado"
  | "analista-marca"
  | "analista-performance"
  | "consolidador"
  | "avaliador";

export interface DefinicaoAgente<T extends z.ZodType = z.ZodType> {
  prompt: PromptAgente;
  esquema: T;
}

export function definicoes() {
  return {
    briefing: { prompt: carregarPrompt(aqui("./briefing/prompt.md")), esquema: SaidaBriefing },
    "analista-mercado": {
      prompt: comConhecimento(carregarPrompt(aqui("./analista-mercado/prompt.md")), [ler("mercado/regras.md"), exemplos()]),
      esquema: DiagnosticoParcial,
    },
    "analista-marca": {
      prompt: comConhecimento(carregarPrompt(aqui("./analista-marca/prompt.md")), [ler("marca/regras.md"), exemplos()]),
      esquema: DiagnosticoParcial,
    },
    "analista-performance": {
      prompt: comConhecimento(carregarPrompt(aqui("./analista-performance/prompt.md")), [ler("performance/regras.md"), exemplos()]),
      esquema: DiagnosticoParcial,
    },
    consolidador: {
      prompt: comConhecimento(carregarPrompt(aqui("./consolidador/prompt.md")), [ler("consolidacao/regras.md"), exemplos()]),
      esquema: RelatorioDiagnostico,
    },
    avaliador: {
      prompt: comConhecimento(carregarPrompt(aqui("./avaliador/prompt.md")), [ler("consolidacao/rubrica.md"), ler("consolidacao/regras.md")]),
      esquema: AvaliacaoQA,
    },
  } satisfies Record<NomeAgente, DefinicaoAgente>;
}

export type Definicoes = ReturnType<typeof definicoes>;

/**
 * Quem executa um agente. Em produção, chama o Claude (ver executor-claude.ts).
 * Em testes e evals, um executor falso devolve respostas fixas.
 */
export interface Executor {
  executar<T extends z.ZodType>(
    nome: NomeAgente,
    def: DefinicaoAgente<T>,
    camadas: Omit<CamadasPrompt, "metodoAx" | "minicerebro">,
  ): Promise<z.infer<T>>;
}
