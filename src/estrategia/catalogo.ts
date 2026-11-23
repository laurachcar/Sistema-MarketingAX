/**
 * Catálogo das categorias estratégicas de uma conta (definido pela Laura em 23/11/2026).
 *
 * Hierarquia: categoria → subcategoria (uma análise) → itens (o que a análise cobre).
 * Cada subcategoria declara os campos de briefing de que precisa; o briefing da conta
 * é a união dos campos básicos com os campos de todas as subcategorias. Por isso ele
 * cresce sozinho quando uma categoria ou subcategoria nova entra no catálogo.
 *
 * O catálogo é código versionado (não tabela): mudou aqui, sobe CATALOGO_VERSAO e o
 * banco grava com qual versão cada briefing e cada análise foram feitos.
 */

export const CATALOGO_VERSAO = "1.1.0";

export interface CampoBriefing {
  id: string;
  rotulo: string;
}

/** Quem faz a análise. `null` = agente ainda não definido (ver CLAUDE.md antes de criar). */
export type Executor =
  | "analista-marca"
  | "analista-mercado"
  | "analista-performance"
  | "estrategista"
  | "planejador-mensal"
  | "agente-infraestrutura"
  | "agente-lancamento"
  | "agente-key-accounts"
  | "agente-processos-vendas"
  | "agente-estrategias-venda"
  | "codigo"
  | null;

export interface Subcategoria {
  id: string;
  nome: string;
  entrega: string;
  itens: readonly string[];
  /** Pode ter uma versão por produto ou serviço da conta. */
  porProduto: boolean;
  executor: Executor;
  campos: readonly string[];
}

export interface Categoria {
  id: IdCategoria;
  nome: string;
  descricao: string;
  subcategorias: readonly Subcategoria[];
}

export type IdCategoria = "branding" | "posicionamento" | "negocio" | "vendas" | "plano" | "resultados";

/** Campos que toda conta pede no cadastro. */
export const CAMPOS_BASE: readonly CampoBriefing[] = [
  { id: "nome", rotulo: "Nome da conta" },
  { id: "nicho", rotulo: "Nicho / segmento" },
  { id: "o_que_vende", rotulo: "O que vende" },
  { id: "site", rotulo: "Site" },
  { id: "instagram", rotulo: "Instagram" },
  { id: "modelo", rotulo: "Modelo (B2B, B2C, ambos)" },
  { id: "regiao", rotulo: "Região de atuação" },
];

/** Todos os campos que alguma subcategoria pode pedir. */
export const CAMPOS: readonly CampoBriefing[] = [
  ...CAMPOS_BASE,
  { id: "portfolio_marcas", rotulo: "Marcas, submarcas e linhas de produto" },
  { id: "profissional_referencia", rotulo: "Profissional de referência (quem é, papel na marca)" },
  { id: "tom_de_voz", rotulo: "Tom de voz desejado" },
  { id: "identidade_visual", rotulo: "Identidade visual (logo, cores, fontes)" },
  { id: "referencias", rotulo: "Referências que admira e que rejeita" },
  { id: "nps_existente", rotulo: "NPS ou pesquisa de satisfação existente" },
  { id: "missao_visao", rotulo: "Missão e visão atuais" },
  { id: "proposta_de_valor", rotulo: "Proposta de valor atual" },
  { id: "publicos_e_nichos", rotulo: "Públicos e nichos atendidos" },
  { id: "concorrentes", rotulo: "3 a 5 concorrentes" },
  { id: "diferenciais", rotulo: "Diferenciais e provas" },
  { id: "metas", rotulo: "Metas de negócio de 3, 6 e 12 meses" },
  { id: "como_mede_sucesso", rotulo: "Como mede sucesso hoje" },
  { id: "equipe_e_ferramentas", rotulo: "Equipe e ferramentas" },
  { id: "verba", rotulo: "Verba de mídia e de produção" },
  { id: "quem_compra", rotulo: "Quem compra e quem decide" },
  { id: "dores_e_objecoes", rotulo: "Dores e objeções" },
  { id: "contas_alvo", rotulo: "Principais clientes e contas-alvo" },
  { id: "ciclo_de_venda", rotulo: "Ciclo de venda" },
  { id: "crm_e_funil", rotulo: "CRM usado e etapas do funil" },
  { id: "preco_e_promocoes", rotulo: "Política de preço e promoções" },
  { id: "materiais_de_venda", rotulo: "Materiais de venda que já existem" },
  { id: "acessos_leitura", rotulo: "Acessos de leitura (redes, analytics, mídia)" },
  { id: "sazonalidade", rotulo: "Sazonalidade e datas importantes" },
  { id: "lancamentos", rotulo: "Lançamentos previstos" },
  { id: "canais_atuais", rotulo: "Canais em uso e o que já funcionou" },
  { id: "fontes_de_dados", rotulo: "Fontes de dados de vendas e leads" },
  { id: "decisoes_pendentes", rotulo: "Decisões que o cliente precisa tomar" },
];

const sub = (s: Subcategoria) => s;

export const CATEGORIAS: readonly Categoria[] = [
  {
    id: "branding",
    nome: "Branding",
    descricao: "Como a marca é construída, vivida e percebida.",
    subcategorias: [
      sub({ id: "arquitetura_de_marca", nome: "Arquitetura de marca", entrega: "Relação entre marca-mãe, submarcas e produtos, e o profissional de referência que dá rosto à marca.", itens: ["Profissional de referência"], porProduto: false, executor: "analista-marca", campos: ["portfolio_marcas", "profissional_referencia"] }),
      sub({ id: "marca", nome: "Marca", entrega: "Como a marca é, fala e é sentida em cada ponto de contato.", itens: ["Experiência de marca", "Brand book", "Arquétipo de marca", "Personalidade de marca", "POPs de marca", "NPS de marca"], porProduto: true, executor: "analista-marca", campos: ["tom_de_voz", "identidade_visual", "referencias", "nps_existente"] }),
    ],
  },
  {
    id: "posicionamento",
    nome: "Posicionamento de marca",
    descricao: "O lugar que a marca quer ocupar na cabeça de cada público.",
    subcategorias: [
      sub({ id: "missao_e_visao", nome: "Missão e visão", entrega: "Missão e visão revisadas, ligadas aos objetivos do negócio.", itens: [], porProduto: false, executor: "estrategista", campos: ["missao_visao"] }),
      sub({ id: "proposito_de_marca", nome: "Propósito de marca", entrega: "Por que a marca existe e como isso vira mensagem para cada público e nicho.", itens: ["Mapa de posicionamento", "Mensagem por público", "PUV (proposta única de valor)", "Estratégias de posicionamento por nicho", "NPS"], porProduto: true, executor: "estrategista", campos: ["proposta_de_valor", "publicos_e_nichos", "concorrentes"] }),
    ],
  },
  {
    id: "negocio",
    nome: "Negócio",
    descricao: "O negócio por dentro e o mercado em volta.",
    subcategorias: [
      sub({ id: "analise_de_mercado", nome: "Análise de mercado", entrega: "Tamanho, tendências, regulação e oportunidades do setor.", itens: [], porProduto: true, executor: "analista-mercado", campos: ["regiao"] }),
      sub({ id: "analise_de_concorrentes", nome: "Análise de concorrentes", entrega: "O que cada concorrente faz melhor e pior, preço, canais e posicionamento.", itens: [], porProduto: true, executor: "analista-mercado", campos: ["concorrentes"] }),
      sub({ id: "swot", nome: "SWOT", entrega: "Forças, fraquezas, oportunidades e ameaças, cada uma com fonte.", itens: [], porProduto: false, executor: "estrategista", campos: ["diferenciais"] }),
      sub({ id: "objetivos_estrategicos", nome: "Objetivos estratégicos", entrega: "Objetivos SMART de 3, 6 e 12 meses e o KPI de cada um.", itens: [], porProduto: false, executor: "estrategista", campos: ["metas", "como_mede_sucesso"] }),
      sub({ id: "infraestrutura", nome: "Infraestrutura necessária", entrega: "Agentes, POPs, procedimentos, playbooks e materiais de apoio que a estratégia exige, e as lacunas contra o que existe hoje.", itens: ["Agentes", "POPs", "Procedimentos", "Playbooks", "Materiais de apoio"], porProduto: false, executor: "agente-infraestrutura", campos: ["equipe_e_ferramentas", "verba"] }),
      sub({ id: "publico_alvo", nome: "Público-alvo detalhado", entrega: "ICP e personas: quem compra, quem decide, dores, objeções e onde estão.", itens: [], porProduto: true, executor: "analista-marca", campos: ["quem_compra", "dores_e_objecoes"] }),
    ],
  },
  {
    id: "vendas",
    nome: "Vendas e comercial",
    descricao: "Como o marketing gera e ajuda a fechar oportunidades.",
    subcategorias: [
      sub({ id: "key_accounts", nome: "Key accounts", entrega: "Contas-alvo, mapa de decisores e plano por conta (ABM).", itens: [], porProduto: false, executor: "agente-key-accounts", campos: ["contas_alvo", "ciclo_de_venda"] }),
      sub({ id: "processos_de_vendas", nome: "Processos de vendas", entrega: "Funil comercial, passagem marketing → vendas e uso do CRM.", itens: [], porProduto: false, executor: "agente-processos-vendas", campos: ["crm_e_funil"] }),
      sub({ id: "estrategias_de_venda", nome: "Estratégias de venda", entrega: "Como a marca vende em cada etapa da jornada de compra.", itens: ["CX", "Jornada de compra", "Promoções", "Técnicas de venda", "Materiais de apoio", "Geração de leads"], porProduto: true, executor: "agente-estrategias-venda", campos: ["preco_e_promocoes", "dores_e_objecoes", "materiais_de_venda"] }),
    ],
  },
  {
    id: "plano",
    nome: "Plano de marketing",
    descricao: "O que fazer, em que canal, para quem e quando.",
    subcategorias: [
      sub({ id: "analise_digital", nome: "Análise digital do negócio", entrega: "Auditoria de redes, site, SEO/GEO e mídia paga, só leitura.", itens: [], porProduto: false, executor: "analista-performance", campos: ["site", "instagram", "acessos_leitura"] }),
      sub({ id: "cronograma", nome: "Cronograma de marketing e ações", entrega: "Calendário de 12 meses com ações, datas, responsáveis e metas.", itens: [], porProduto: false, executor: "planejador-mensal", campos: ["sazonalidade"] }),
      sub({ id: "estrategia_de_lancamento", nome: "Estratégia de lançamento", entrega: "Modelo AX de lançamento adaptado ao produto ou serviço, com as cinco fases.", itens: ["Aquecimento de mercado", "Pré-lançamento", "Lançamento", "Sustentação", "Pós-lançamento"], porProduto: true, executor: "agente-lancamento", campos: ["lancamentos"] }),
      sub({ id: "plano_de_comunicacao", nome: "Plano de comunicação", entrega: "Mensagens, tom e frequência por público e por canal.", itens: [], porProduto: false, executor: "estrategista", campos: ["publicos_e_nichos", "tom_de_voz"] }),
      sub({ id: "canais", nome: "Canais", entrega: "Papel de cada canal na jornada e onde investir esforço.", itens: [], porProduto: false, executor: "analista-performance", campos: ["canais_atuais"] }),
    ],
  },
  {
    id: "resultados",
    nome: "Resultados",
    descricao: "Os números que dizem se a estratégia está funcionando.",
    subcategorias: [
      sub({ id: "kpis", nome: "KPIs", entrega: "Indicadores por objetivo, com meta, fonte e frequência.", itens: [], porProduto: false, executor: "estrategista", campos: ["metas"] }),
      sub({ id: "integracao_de_resultados", nome: "Integração e análise de resultados", entrega: "Dados de vendas, marketing e mídia juntos e lidos todo mês.", itens: [], porProduto: false, executor: "analista-performance", campos: ["fontes_de_dados"] }),
      sub({ id: "cruzamento_de_dados", nome: "Cruzamento de dados para decisão", entrega: "Cruzamentos que respondem perguntas de negócio, com recomendação.", itens: [], porProduto: false, executor: "analista-performance", campos: ["decisoes_pendentes"] }),
      sub({ id: "dashboard", nome: "Dashboard", entrega: "Painel com LTV, ticket médio x PA, leads e metas, calculados em código.", itens: [], porProduto: false, executor: "codigo", campos: ["fontes_de_dados"] }),
    ],
  },
];

// ---------- Entregas montadas a partir das análises aprovadas ----------

export type IdEntrega = "plano_de_marketing" | "plano_de_comunicacao";

export interface Entrega {
  id: IdEntrega;
  nome: string;
  /** Categorias inteiras que entram. */
  categorias: readonly IdCategoria[];
  /** Subcategorias avulsas que entram, além das categorias inteiras. */
  subcategorias: readonly string[];
}

export const ENTREGAS: readonly Entrega[] = [
  { id: "plano_de_marketing", nome: "Plano de Marketing detalhado", categorias: ["negocio", "posicionamento", "vendas", "plano", "resultados"], subcategorias: [] },
  { id: "plano_de_comunicacao", nome: "Plano de Comunicação", categorias: [], subcategorias: ["marca", "proposito_de_marca", "publico_alvo", "plano_de_comunicacao", "canais", "cronograma"] },
];

// ---------- Consultas ----------

const camposPorId = new Map(CAMPOS.map((c) => [c.id, c]));

export function subcategoria(id: string): { categoria: Categoria; sub: Subcategoria } {
  for (const categoria of CATEGORIAS) {
    const s = categoria.subcategorias.find((x) => x.id === id);
    if (s) return { categoria, sub: s };
  }
  throw new Error(`subcategoria desconhecida: ${id}`);
}

export interface CampoDoBriefing extends CampoBriefing {
  /** "base" ou os ids das categorias que pedem o campo. */
  pedidoPor: string[];
}

/** O briefing completo da conta: campos básicos + tudo o que as subcategorias pedem, sem repetir. */
export function camposDoBriefing(): CampoDoBriefing[] {
  const saida = new Map<string, CampoDoBriefing>();
  for (const c of CAMPOS_BASE) saida.set(c.id, { ...c, pedidoPor: ["base"] });
  for (const cat of CATEGORIAS) {
    for (const s of cat.subcategorias) {
      for (const id of s.campos) {
        const campo = camposPorId.get(id);
        if (!campo) throw new Error(`campo ${id} não existe em CAMPOS`);
        const atual = saida.get(id) ?? { ...campo, pedidoPor: [] };
        if (!atual.pedidoPor.includes(cat.id) && !atual.pedidoPor.includes("base")) atual.pedidoPor.push(cat.id);
        saida.set(id, atual);
      }
    }
  }
  return [...saida.values()];
}

export type RespostasBriefing = Record<string, string | undefined>;

const preenchido = (v: string | undefined) => typeof v === "string" && v.trim().length > 0;

/** Campos que faltam no briefing para a subcategoria poder começar. */
export function camposFaltando(subId: string, respostas: RespostasBriefing): CampoBriefing[] {
  const { sub: s } = subcategoria(subId);
  return s.campos.filter((id) => !preenchido(respostas[id])).map((id) => camposPorId.get(id)!);
}

export function podeIniciar(subId: string, respostas: RespostasBriefing): boolean {
  return camposFaltando(subId, respostas).length === 0;
}

export function completudeDoBriefing(respostas: RespostasBriefing): { preenchidos: number; total: number } {
  const campos = camposDoBriefing();
  return { preenchidos: campos.filter((c) => preenchido(respostas[c.id])).length, total: campos.length };
}

/** Subcategorias que compõem uma entrega. */
export function subcategoriasDaEntrega(id: IdEntrega): Subcategoria[] {
  const e = ENTREGAS.find((x) => x.id === id);
  if (!e) throw new Error(`entrega desconhecida: ${id}`);
  const saida: Subcategoria[] = [];
  for (const cat of CATEGORIAS) {
    for (const s of cat.subcategorias) {
      if (e.categorias.includes(cat.id) || e.subcategorias.includes(s.id)) saida.push(s);
    }
  }
  return saida;
}

/**
 * A entrega só é liberada quando todas as suas subcategorias têm análise aprovada.
 * Para subcategorias por produto, basta a análise geral (produto nulo) aprovada.
 */
export function entregaLiberada(id: IdEntrega, aprovadas: ReadonlySet<string>): { liberada: boolean; faltam: string[] } {
  const faltam = subcategoriasDaEntrega(id).filter((s) => !aprovadas.has(s.id)).map((s) => s.id);
  return { liberada: faltam.length === 0, faltam };
}
