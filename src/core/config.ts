import { z } from "zod";

/**
 * Configuração lida do ambiente. Falha cedo e com mensagem clara se faltar algo.
 * Modelos: barato por padrão, forte só onde a arquitetura pede (Estrategista e Avaliador).
 */
const EsquemaConfig = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  AX_MODELO_PADRAO: z.string().default("claude-haiku-5-5"),
  AX_MODELO_FORTE: z.string().default("claude-sonnet-5-5"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  AX_TETO_TOKENS_CLIENTE_MES: z.coerce.number().int().positive().default(2_000_000),
});

export type Config = z.infer<typeof EsquemaConfig>;

export function carregarConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return EsquemaConfig.parse(env);
}

/** Qual modelo cada papel usa. Mudar aqui muda o custo do sistema inteiro. */
export type Papel = "padrao" | "forte";

export function modeloPara(papel: Papel, config: Config): string {
  return papel === "forte" ? config.AX_MODELO_FORTE : config.AX_MODELO_PADRAO;
}
