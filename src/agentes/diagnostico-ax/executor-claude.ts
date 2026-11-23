import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { carregarConfig, modeloPara, type Config } from "../../core/config.js";
import { chamarEstruturado } from "../../core/llm.js";
import type { CamadasPrompt } from "../../core/prompt.js";
import type { DestinoRegistro } from "../../core/registro.js";
import type { ContextoCliente } from "../../core/tenant.js";
import type { DefinicaoAgente, Executor, NomeAgente } from "./agentes.js";

export interface OpcoesExecutorClaude {
  ctx: ContextoCliente;
  metodoAx: string;
  /** Trechos do minicérebro por agente (camada 2), além das instruções do prompt.md. */
  conhecimentoPorAgente?: Partial<Record<NomeAgente, string>>;
  registro: DestinoRegistro;
  config?: Config;
  cliente?: Anthropic;
}

export function criarExecutorClaude(o: OpcoesExecutorClaude): Executor {
  const config = o.config ?? carregarConfig();
  const cliente = o.cliente ?? new Anthropic();
  return {
    async executar<T extends z.ZodType>(
      nome: NomeAgente,
      def: DefinicaoAgente<T>,
      camadas: Omit<CamadasPrompt, "metodoAx" | "minicerebro">,
    ): Promise<z.infer<T>> {
      const extra = o.conhecimentoPorAgente?.[nome];
      return chamarEstruturado(cliente, o.registro, {
        ctx: o.ctx,
        agente: nome,
        versaoPrompt: def.prompt.versao,
        modelo: modeloPara(def.prompt.papel, config),
        esquema: def.esquema,
        esforco: def.prompt.papel === "forte" ? "high" : "medium",
        camadas: {
          ...camadas,
          metodoAx: o.metodoAx,
          minicerebro: extra ? `${def.prompt.texto}\n\n<conhecimento>\n${extra}\n</conhecimento>` : def.prompt.texto,
        },
      });
    },
  };
}
