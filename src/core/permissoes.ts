/**
 * O que os agentes podem e não podem fazer. A trava é de ferramenta, não de prompt:
 * uma ação bloqueada simplesmente não existe como ferramenta, então nenhuma
 * injeção de prompt consegue forçá-la.
 */

export const ACOES_PERMITIDAS = [
  "ler_dados_do_cliente",
  "ler_conhecimento",
  "ler_metricas_publicas",
  "sugerir",
  "gerar_rascunho",
  "publicar_post_aprovado", // só posts de um calendário já aprovado (fase 2)
] as const;

export const ACOES_BLOQUEADAS = [
  "alterar_verba",
  "criar_campanha_paga",
  "pausar_campanha_paga",
  "enviar_mensagem_ao_cliente",
  "responder_cliente",
  "excluir_dados",
] as const;

export type AcaoPermitida = (typeof ACOES_PERMITIDAS)[number];
export type AcaoBloqueada = (typeof ACOES_BLOQUEADAS)[number];

export function acaoPermitida(acao: string): acao is AcaoPermitida {
  return (ACOES_PERMITIDAS as readonly string[]).includes(acao);
}
