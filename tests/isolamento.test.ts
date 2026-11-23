import { describe, expect, it } from "vitest";
import { criarContexto, ErroIsolamento, garantirMesmoCliente, somenteDoCliente } from "../src/core/tenant.js";

const T = "00000000-0000-4000-8000-000000000001";
const A = "00000000-0000-4000-8000-0000000000c1";
const B = "00000000-0000-4000-8000-0000000000c2";

describe("isolamento entre clientes", () => {
  const ctxA = criarContexto(T, A);

  it("aceita registro do próprio cliente e conhecimento do tenant", () => {
    expect(() => garantirMesmoCliente(ctxA, { tenant_id: T, client_id: A })).not.toThrow();
    expect(() => garantirMesmoCliente(ctxA, { tenant_id: T, client_id: null })).not.toThrow();
  });

  it("bloqueia registro de outro cliente", () => {
    expect(() => garantirMesmoCliente(ctxA, { tenant_id: T, client_id: B })).toThrow(ErroIsolamento);
  });

  it("bloqueia registro de outro tenant, mesmo sendo conhecimento global", () => {
    const outro = "00000000-0000-4000-8000-0000000000ff";
    expect(() => garantirMesmoCliente(ctxA, { tenant_id: outro, client_id: null })).toThrow(ErroIsolamento);
  });

  it("lista com um item de outro cliente falha inteira (não filtra em silêncio)", () => {
    expect(() =>
      somenteDoCliente(ctxA, [
        { tenant_id: T, client_id: A },
        { tenant_id: T, client_id: B },
      ]),
    ).toThrow(ErroIsolamento);
  });

  it("recusa ids que não são UUID (ex.: vindos de texto do modelo)", () => {
    expect(() => criarContexto(T, "cliente-a")).toThrow(ErroIsolamento);
  });
});
