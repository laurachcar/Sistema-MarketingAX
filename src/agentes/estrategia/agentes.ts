import { carregarPrompt } from "../../core/carregar-prompt.js";
import type { DefinicaoAgente } from "../diagnostico-ax/agentes.js";
import {
  SaidaEstrategiasVenda,
  SaidaInfraestrutura,
  SaidaKeyAccounts,
  SaidaLancamento,
  SaidaProcessosVendas,
} from "./schemas.js";

const aqui = (rel: string) => new URL(rel, import.meta.url);

export type NomeAgenteEstrategia =
  | "agente-infraestrutura"
  | "agente-lancamento"
  | "agente-key-accounts"
  | "agente-processos-vendas"
  | "agente-estrategias-venda";

export function definicoesEstrategia() {
  return {
    "agente-infraestrutura": { prompt: carregarPrompt(aqui("./infraestrutura/prompt.md")), esquema: SaidaInfraestrutura },
    "agente-lancamento": { prompt: carregarPrompt(aqui("./lancamento/prompt.md")), esquema: SaidaLancamento },
    "agente-key-accounts": { prompt: carregarPrompt(aqui("./key-accounts/prompt.md")), esquema: SaidaKeyAccounts },
    "agente-processos-vendas": { prompt: carregarPrompt(aqui("./processos-vendas/prompt.md")), esquema: SaidaProcessosVendas },
    "agente-estrategias-venda": { prompt: carregarPrompt(aqui("./estrategias-venda/prompt.md")), esquema: SaidaEstrategiasVenda },
  } satisfies Record<NomeAgenteEstrategia, DefinicaoAgente>;
}
