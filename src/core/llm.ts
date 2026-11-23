import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { ContextoCliente } from "./tenant.js";
import type { DestinoRegistro } from "./registro.js";
import { montarMensagemUsuario, montarSystem, type CamadasPrompt } from "./prompt.js";

export interface ChamadaEstruturada<T extends z.ZodType> {
  ctx: ContextoCliente;
  agente: string;
  versaoPrompt: string;
  modelo: string;
  camadas: CamadasPrompt;
  esquema: T;
  maxTokens?: number;
  esforco?: "low" | "medium" | "high";
}

export class ErroAgente extends Error {
  constructor(
    mensagem: string,
    readonly motivo: "recusa" | "truncado" | "saida_invalida",
  ) {
    super(mensagem);
    this.name = "ErroAgente";
  }
}

/**
 * Uma chamada ao Claude com saída validada por esquema (JSON Schema via Zod).
 * Sem ferramentas: os agentes do Diagnóstico AX só leem o que o orquestrador entrega.
 */
export async function chamarEstruturado<T extends z.ZodType>(
  cliente: Anthropic,
  registro: DestinoRegistro,
  p: ChamadaEstruturada<T>,
): Promise<z.infer<T>> {
  const inicio = new Date();
  const base = {
    tenantId: p.ctx.tenantId,
    clientId: p.ctx.clientId,
    agente: p.agente,
    modelo: p.modelo,
    versaoPrompt: p.versaoPrompt,
    inicio: inicio.toISOString(),
  };

  try {
    const resposta = await cliente.messages.parse({
      model: p.modelo,
      max_tokens: p.maxTokens ?? 16000,
      system: montarSystem(p.camadas),
      messages: [{ role: "user", content: montarMensagemUsuario(p.camadas) }],
      output_config: { format: zodOutputFormat(p.esquema), effort: p.esforco ?? "medium" },
    });

    const u = resposta.usage;
    const status =
      resposta.stop_reason === "refusal" ? "recusa" : resposta.stop_reason === "max_tokens" ? "truncado" : "ok";

    await registro.gravar({
      ...base,
      duracaoMs: Date.now() - inicio.getTime(),
      tokensEntrada: u.input_tokens,
      tokensSaida: u.output_tokens,
      tokensCacheLidos: u.cache_read_input_tokens ?? 0,
      tokensCacheEscritos: u.cache_creation_input_tokens ?? 0,
      status,
    });

    if (status === "recusa") throw new ErroAgente(`${p.agente}: o modelo recusou o pedido`, "recusa");
    if (status === "truncado") throw new ErroAgente(`${p.agente}: saída cortada por max_tokens`, "truncado");
    if (resposta.parsed_output == null) throw new ErroAgente(`${p.agente}: saída fora do esquema`, "saida_invalida");
    return resposta.parsed_output as z.infer<T>;
  } catch (e) {
    if (!(e instanceof ErroAgente)) {
      await registro.gravar({
        ...base,
        duracaoMs: Date.now() - inicio.getTime(),
        tokensEntrada: 0,
        tokensSaida: 0,
        tokensCacheLidos: 0,
        tokensCacheEscritos: 0,
        status: "erro",
        erro: e instanceof Error ? e.message : String(e),
      });
    }
    throw e;
  }
}
