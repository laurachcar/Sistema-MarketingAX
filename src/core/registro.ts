/**
 * Log de execução: toda chamada de agente fica registrada com custo e duração.
 * É a base para medir custo por diagnóstico e o teto de tokens por cliente.
 */

export interface RegistroExecucao {
  tenantId: string;
  clientId: string;
  agente: string;
  modelo: string;
  versaoPrompt: string;
  inicio: string;
  duracaoMs: number;
  tokensEntrada: number;
  tokensSaida: number;
  tokensCacheLidos: number;
  tokensCacheEscritos: number;
  status: "ok" | "erro" | "recusa" | "truncado";
  erro?: string;
}

export interface DestinoRegistro {
  gravar(r: RegistroExecucao): Promise<void>;
}

/** Usado em testes e no modo local. Em produção, um destino Supabase grava na tabela registros_execucao. */
export class RegistroEmMemoria implements DestinoRegistro {
  readonly itens: RegistroExecucao[] = [];
  async gravar(r: RegistroExecucao): Promise<void> {
    this.itens.push(r);
  }
}
