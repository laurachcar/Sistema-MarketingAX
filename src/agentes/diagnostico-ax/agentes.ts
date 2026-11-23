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
    "analista-mercado": { prompt: carregarPrompt(aqui("./analista-mercado/prompt.md")), esquema: DiagnosticoParcial },
    "analista-marca": { prompt: carregarPrompt(aqui("./analista-marca/prompt.md")), esquema: DiagnosticoParcial },
    "analista-performance": { prompt: carregarPrompt(aqui("./analista-performance/prompt.md")), esquema: DiagnosticoParcial },
    consolidador: { prompt: carregarPrompt(aqui("./consolidador/prompt.md")), esquema: RelatorioDiagnostico },
    avaliador: { prompt: carregarPrompt(aqui("./avaliador/prompt.md")), esquema: AvaliacaoQA },
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
