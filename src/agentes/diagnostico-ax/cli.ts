/**
 * Roda a Fase 1 (Briefing) do Diagnóstico AX a partir de um arquivo JSON.
 *
 *   npm run diagnostico -- caminho/entrada.json            # só mostra o prompt montado (sem custo)
 *   npm run diagnostico -- caminho/entrada.json --executar # chama o Claude
 */
import { readFileSync } from "node:fs";
import { z } from "zod";
import { montarMensagemUsuario, montarSystem } from "../../core/prompt.js";
import { RegistroEmMemoria } from "../../core/registro.js";
import { criarContexto } from "../../core/tenant.js";
import { definicoes } from "./agentes.js";
import { criarExecutorClaude } from "./executor-claude.js";
import { fase1Briefing } from "./orquestrador.js";

const Entrada = z.object({
  tenantId: z.string(),
  clientId: z.string(),
  nomeCliente: z.string(),
  formulario: z.string(),
  materiais: z.array(z.object({ origem: z.string(), conteudo: z.string() })).default([]),
});

async function main() {
  const [arquivo, flag] = process.argv.slice(2);
  if (!arquivo) throw new Error("uso: npm run diagnostico -- <entrada.json> [--executar]");
  const entrada = Entrada.parse(JSON.parse(readFileSync(arquivo, "utf8")));
  const ctx = criarContexto(entrada.tenantId, entrada.clientId);
  const metodoAx = readFileSync(new URL("../../../conhecimento/metodo-ax/metodo.md", import.meta.url), "utf8");
  const defs = definicoes();

  if (flag !== "--executar") {
    const camadas = {
      metodoAx,
      minicerebro: defs.briefing.prompt.texto,
      dadosExternos: [{ origem: "formulario_briefing", conteudo: entrada.formulario }, ...entrada.materiais],
      pedido: `Monte o briefing estruturado do cliente "${entrada.nomeCliente}" e liste as lacunas.`,
    };
    console.log("=== SYSTEM ===");
    for (const b of montarSystem(camadas)) console.log(b.text, b.cache_control ? "\n[cache]" : "", "\n");
    console.log("=== USER ===\n" + montarMensagemUsuario(camadas));
    return;
  }

  const registro = new RegistroEmMemoria();
  const exec = criarExecutorClaude({ ctx, metodoAx, registro });
  const resultado = await fase1Briefing(exec, defs, entrada);
  console.log(JSON.stringify(resultado, null, 2));
  console.error("custo:", JSON.stringify(registro.itens, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
