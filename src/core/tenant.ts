/**
 * Isolamento entre clientes: a trava mais importante do Sistema AX.
 *
 * Regra: todo dado carrega tenant_id (agência) e client_id (cliente).
 * O contexto é criado pelo código do orquestrador, nunca a partir de texto do modelo,
 * e toda leitura ou escrita passa por `garantirMesmoCliente`.
 */

declare const marca: unique symbol;

export interface ContextoCliente {
  readonly tenantId: string;
  readonly clientId: string;
  readonly [marca]: "ContextoCliente";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function criarContexto(tenantId: string, clientId: string): ContextoCliente {
  if (!UUID.test(tenantId) || !UUID.test(clientId)) {
    throw new ErroIsolamento("tenant_id e client_id precisam ser UUIDs válidos");
  }
  return Object.freeze({ tenantId, clientId }) as ContextoCliente;
}

export class ErroIsolamento extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroIsolamento";
  }
}

export interface RegistroEscopado {
  tenant_id: string;
  client_id: string | null; // null = conhecimento do tenant (Método AX, minicérebros)
}

/**
 * Lança erro se o registro for de outro cliente.
 * Registros de nível tenant (client_id null) são permitidos dentro do mesmo tenant.
 */
export function garantirMesmoCliente(ctx: ContextoCliente, registro: RegistroEscopado): void {
  if (registro.tenant_id !== ctx.tenantId) {
    throw new ErroIsolamento("registro de outro tenant bloqueado");
  }
  if (registro.client_id !== null && registro.client_id !== ctx.clientId) {
    throw new ErroIsolamento("registro de outro cliente bloqueado");
  }
}

/** Filtra uma lista e lança erro se algo de outro cliente aparecer (não descarta em silêncio). */
export function somenteDoCliente<T extends RegistroEscopado>(ctx: ContextoCliente, registros: T[]): T[] {
  registros.forEach((r) => garantirMesmoCliente(ctx, r));
  return registros;
}
