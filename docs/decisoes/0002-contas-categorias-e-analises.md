# 0002 — Contas, categorias estratégicas e briefing dinâmico

Data: 2026-11-23 · Estado: proposta (aguarda revisão da Laura)

## Contexto
A Laura definiu como o sistema é usado no dia a dia (protótipo de tela: https://claude.ai/artifact/WatM6c2yJbjuEJEW7dpZ6v):
a abertura mostra as contas (hoje AX Marketing, Biomédica, Mula e Paschoa e Motta), e cada conta passa por 6 categorias estratégicas,
nesta ordem: Branding, Posicionamento de marca, Negócio, Vendas e comercial, Plano de marketing e Resultados. Cada categoria tem
subcategorias (uma análise cada) e algumas têm itens (o que a análise cobre). O Plano de Marketing e o Plano de Comunicação são
montados a partir das análises aprovadas, sem template fixo. O briefing precisa crescer a cada camada nova do sistema.

## Decisão
- **Catálogo em código, dados no banco.** Categorias, subcategorias, itens, campos de briefing e composição das entregas ficam em
  `src/estrategia/catalogo.ts`, com `CATALOGO_VERSAO`. O banco guarda só o que é da conta e grava com qual versão do catálogo cada
  briefing e cada análise foram feitos. Mudar o catálogo é um PR revisável, não uma edição solta numa tabela.
- **Briefing dinâmico = união de campos.** Cada subcategoria declara os campos de que precisa. O briefing da conta é a união dos
  campos básicos com os de todas as subcategorias. Uma subcategoria nova faz o briefing pedir os campos dela automaticamente, e uma
  análise só começa com os seus campos preenchidos (`podeIniciar`).
- **Análise por produto.** Subcategorias marcadas `porProduto` podem ter uma versão por produto ou serviço (`analises.produto_id`).
  A chave estrangeira composta impede apontar para produto de outra conta.
- **Aprovação é trava de banco.** Só membro da agência (JWT `ax_papel = membro`) muda uma análise ou entrega para `aprovada`, e uma
  análise aprovada não muda mais por agente. Uma entrega só pode citar análises aprovadas da mesma conta.
- **Cinco agentes novos** (respostas da Laura em 23/11/2026, ver `src/agentes/estrategia/`):
  - `agente-infraestrutura` (padrão): lista agentes, POPs, procedimentos, playbooks e materiais de apoio que a estratégia exige e
    aponta só as lacunas, sem orçamento nem fornecedor.
  - `agente-lancamento` (forte, cerca de 4 por mês): adapta o modelo AX de lançamento ao produto, sempre com as 5 fases (aquecimento,
    pré-lançamento, lançamento, sustentação, pós), checadas em código.
  - Vendas em três agentes separados (padrão): `agente-key-accounts` (decisor só por cargo, nunca dado pessoal),
    `agente-processos-vendas` (dados de planilhas e ferramentas, só leitura) e `agente-estrategias-venda` (preço e promoção sempre
    como sugestão com aprovação comercial, checado em código).

## Consequências
- O painel lê o catálogo do código para montar telas e formulários; não há tela para editar categorias.
- Testes: `tests/catalogo.test.ts` (catálogo e briefing) e `supabase/tests/contas.test.sql` (isolamento e aprovação).
