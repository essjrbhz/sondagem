# Sistema Geothra — Índice

**Última atualização:** 06/05/2026
**Empresa:** Geothra (Geologia & Geotecnia) — Belo Horizonte, MG
**Repositório:** github.com/essjrbhz/sondagem
**Branch ativa:** `feature/demo-diretoria`
**Reunião decisiva:** 08/05/2026 com 2 diretores

---

## Arquivos desta consolidação

| # | Arquivo | Conteúdo |
|---|---|---|
| 01 | [Visão e Arquitetura](sistema-geral-geothra-01-visao-arquitetura.md) | Hierarquia de domínio, decisões fechadas, arquétipos contratuais, modelo de pendências, capacidade estratégica central |
| 02 | [Stack e Infraestrutura](sistema-geral-geothra-02-stack-infraestrutura.md) | Tecnologias (FastAPI + React + Postgres), identidade visual, estrutura do projeto, ambiente de desenvolvimento, workflow Claude Code |
| 03 | [Modelo Comercial](sistema-geral-geothra-03-modelo-comercial.md) | Posicionamento, fatias F0–F5 (R$ 35k → R$ 550k), argumentos de venda, objeções, estratégia longo prazo |
| 04 | [Análise de Contratos](sistema-geral-geothra-04-analise-contratos.md) | MUSA/Usiminas profundo, padrões estruturais, BM como query derivada, modelo polimórfico de pendências |
| 05 | [Análise Gestão OBRAS](sistema-geral-geothra-05-analise-gestao-obras.md) | Os 3 arquivos-âncora dissecados (Controle Sondas, Efetivos, Plano de Ação), padrão de governança semanal |
| 06 | [Integração RDO/SharePoint](sistema-geral-geothra-06-integracao-rdo-sharepoint.md) | Microsoft Graph, App Registration, pipeline de sync, dados sincronizados, mapeamento campo a campo |
| 07 | [Demo Diretoria 08/05](sistema-geral-geothra-07-demo-diretoria-08-05.md) | Status atual da branch, 3 telas-chave, roteiro da demo, cenários de saída |
| 08 | [Integrações Futuras](sistema-geral-geothra-08-integracoes-futuras.md) | Omie ERP (em estudo), WhatsApp, exportações por cliente, instrumentação, EQUIPAMENTOS |

---

## Mapa rápido de decisões fechadas

- **Sistema novo é fonte de verdade** para Cliente/Contrato/Obra/OS/Campanha; RDO continua execução de campo
- **UI usa "Campanha"**, sistema armazena código de Frente do RDO como atributo
- **Frente com sufixo letra** = mesma OS, equipes diferentes, campanhas distintas
- **OS contratual é DERIVADA** por agrupamento das Frentes pelo número-base
- **1 campanha = 1 equipamento + 1 equipe + 1 lista de furos**; equipamento pode ser substituído
- **Stack:** FastAPI 0.115 + SQLAlchemy 2.0 + Alembic + Postgres 16 + JWT, React 19 + TS + Vite + Tailwind v3
- **Identidade visual:** primary `#003440`, accent `#E6D352`, gold `#B29312`
- **F0 não-negociável** (R$ 35k, descoberta, 4 semanas)
- **Pagamento por fatia:** 30/40/30
- **Excel operacional FORA do escopo** da semana atual (Plano de Ação, Efetivos, Controle Sondas) — entram em F1/F2

---

## Estado da branch `feature/demo-diretoria` (em 06/05)

**Database populada:**
- 19 clientes
- 36 equipamentos
- 93 pessoas
- 23 obras
- 63 campanhas
- 1.676 RDOs (visíveis)

**Pendências da quarta 06/05 (7:15–11h):**
- Sync Furo / RDO / RDOFuro
- Tela Mapa Brasil + KPIs
- Tela Ficha Consolidada de Obra

**Pendências da quinta 07/05:**
- Painel de Inteligência (riscos iminentes)
- Polimento, identidade visual
- Roteiro da demo

**Pendências da sexta 08/05 manhã:**
- Sync RDO uma última vez
- Demo localhost no notebook

---

## Princípios que orientam o trabalho

1. **Estrutura primeiro, polimento depois.** Não vender feature bonita sem fundação sólida.
2. **Tempo máximo em planejamento conceitual antes de código.**
3. **Estudo comparativo de múltiplos contratos** para identificar padrões estruturais — não generalizar a partir de um.
4. **Crítica honesta acima de validação.** Veio prefere apontamento direto a elogio fácil.
5. **Sequencial, decisão por decisão.** Não despejar opções todas de uma vez.
6. **Linguagem com diretores:** sem jargão técnico, sem buzzwords de IA, números concretos (R$, horas, %).
7. **Demo localhost.** Não depender de internet ao vivo. Sync feito antes.
8. **Dados reais, não mock.** Sistema sabe ou não sabe — não inventa.
9. **Sem AI buzzword na venda.** "Lucro maior", "menos dor de cabeça", não "inteligência artificial".

---

## Como usar estes arquivos

Cada arquivo é **autossuficiente** — pode ser lido isoladamente sem perder contexto. Quando uma decisão atravessa arquivos (ex.: posicionamento profissional aparece no 03, mas afeta 07), há referência cruzada.

Em caso de inconsistência entre arquivos, **a `userMemories` da conversa atual é a fonte mais recente**. Estes arquivos são snapshot de 06/05/2026.
