import { describe, expect, it } from "vitest";
import {
  CAMPOS,
  CAMPOS_BASE,
  CATEGORIAS,
  ENTREGAS,
  camposDoBriefing,
  camposFaltando,
  completudeDoBriefing,
  entregaLiberada,
  podeIniciar,
  subcategoriasDaEntrega,
} from "../src/estrategia/catalogo.js";

const todasSubs = CATEGORIAS.flatMap((c) => c.subcategorias);

describe("catálogo de categorias estratégicas", () => {
  it("tem as 6 categorias na ordem da Laura", () => {
    expect(CATEGORIAS.map((c) => c.id)).toEqual(["branding", "posicionamento", "negocio", "vendas", "plano", "resultados"]);
  });

  it("ids de subcategoria e de campo são únicos e em snake_case", () => {
    const subs = todasSubs.map((s) => s.id);
    expect(new Set(subs).size).toBe(subs.length);
    const campos = CAMPOS.map((c) => c.id);
    expect(new Set(campos).size).toBe(campos.length);
    for (const id of [...subs, ...campos]) expect(id).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it("todo campo pedido por uma subcategoria existe e todo campo existe por um motivo", () => {
    const ids = new Set(CAMPOS.map((c) => c.id));
    const usados = new Set<string>(CAMPOS_BASE.map((c) => c.id));
    for (const s of todasSubs) {
      expect(s.campos.length).toBeGreaterThan(0);
      for (const c of s.campos) {
        expect(ids.has(c)).toBe(true);
        usados.add(c);
      }
    }
    expect([...ids].filter((id) => !usados.has(id))).toEqual([]);
  });

  it("subcategorias pedidas pela Laura estão no catálogo", () => {
    const nomes = todasSubs.map((s) => s.nome);
    for (const n of ["Arquitetura de marca", "Propósito de marca", "SWOT", "Key accounts", "Estratégia de lançamento", "Dashboard"]) {
      expect(nomes).toContain(n);
    }
    const marca = todasSubs.find((s) => s.id === "marca")!;
    expect(marca.itens).toEqual(["Experiência de marca", "Brand book", "Arquétipo de marca", "Personalidade de marca", "POPs de marca", "NPS de marca"]);
  });
});

describe("briefing dinâmico", () => {
  it("é a união dos campos básicos com os das subcategorias, sem repetir", () => {
    const campos = camposDoBriefing();
    expect(campos.length).toBe(new Set(campos.map((c) => c.id)).size);
    expect(campos.slice(0, CAMPOS_BASE.length).every((c) => c.pedidoPor[0] === "base")).toBe(true);
    const concorrentes = campos.find((c) => c.id === "concorrentes")!;
    expect(concorrentes.pedidoPor.sort()).toEqual(["negocio", "posicionamento"]);
  });

  it("a análise só começa com os campos dela preenchidos", () => {
    expect(podeIniciar("swot", {})).toBe(false);
    expect(camposFaltando("swot", { diferenciais: "   " }).map((c) => c.id)).toEqual(["diferenciais"]);
    expect(podeIniciar("swot", { diferenciais: "Distribuição nacional" })).toBe(true);
  });

  it("mede a completude sobre todos os campos", () => {
    const { preenchidos, total } = completudeDoBriefing({ nome: "Conta", nicho: "Saúde" });
    expect(preenchidos).toBe(2);
    expect(total).toBe(camposDoBriefing().length);
  });

  it("subcategoria desconhecida falha alto", () => {
    expect(() => podeIniciar("nao_existe", {})).toThrow();
  });
});

describe("entregas montadas a partir das análises aprovadas", () => {
  it("cada entrega tem subcategorias e todas existem", () => {
    for (const e of ENTREGAS) expect(subcategoriasDaEntrega(e.id).length).toBeGreaterThan(0);
  });

  it("o plano de comunicação só libera com todas as análises dele aprovadas", () => {
    const necessarias = subcategoriasDaEntrega("plano_de_comunicacao").map((s) => s.id);
    const quase = new Set(necessarias.slice(1));
    expect(entregaLiberada("plano_de_comunicacao", quase)).toEqual({ liberada: false, faltam: [necessarias[0]] });
    expect(entregaLiberada("plano_de_comunicacao", new Set(necessarias)).liberada).toBe(true);
  });
});
