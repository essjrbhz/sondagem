# Sistema Geothra — Análise Gestão OBRAS (Excel)

**Última atualização:** 06/05/2026
**Data da análise:** 04/05/2026
**Outputs salvos:**
- `/mnt/user-data/outputs/geothra-gestao-obras-analise-inicial.md`
- `/mnt/user-data/outputs/geothra-3-arquivos-ancora-dissecados.md`

---

## Contexto

A pasta SharePoint **"Gestão OBRAS"** contém o ferramental Excel atual da Geothra para acompanhamento operacional. Foi analisada como base para entender o que o sistema novo precisa absorver, substituir ou conviver.

**Decisão tomada:** estender o Geothra (mesmo repo `essjrbhz/sondagem`), não criar módulo separado. Fatiamento por funcionalidade, não por origem dos dados.

---

## Estrutura da pasta

Três subpastas:

### 1. Efetivo
Controle de pessoas/equipes alocadas por obra.

### 2. Ações
**14 arquivos `.xlsm`** — um Plano de Ação por OS, com macros VBA. Padrão claro de governança: reunião semanal de obras onde a diretoria revisa e atualiza ações pendentes por obra.

### 3. Acompanhamento
**6 spreadsheets** de tracking de furos por obra ativa.

---

## Os 3 arquivos-âncora dissecados

### A) `Controle Sondas.xlsx`
**Função:** registro central de qual sonda está onde, com qual equipe, em qual obra.

**Estrutura observada:**
- Lista de sondas (Sandra, Mara, Vera, etc. — nomes próprios, não códigos)
- Status: em operação / em manutenção / disponível / mobilização
- Localização atual
- Equipe alocada
- Obra atual

**Limitações:**
- Manutenção do controle é manual; depende de alguém atualizar
- Histórico de movimentação é perdido (só estado atual)
- Não cruza automaticamente com RDO (RDO sabe que sonda foi usada hoje, planilha pode estar desatualizada)

**Mapeamento no sistema novo:** entidade `Equipamento` com histórico de alocação (sonda → campanha → obra). Status derivado da última atividade no RDO.

### B) `Efetivos Atualizados - Todas as Obras.xlsx`
**Função:** lista de todas as pessoas alocadas em cada obra ativa.

**Estrutura observada:**
- Pessoas (sondador, auxiliar, geólogo, técnico)
- Função na obra
- Período de alocação
- Obra correspondente

**Limitações:**
- Versão única para todas as obras (concorrência se duas pessoas editarem)
- Sem trilha de quem entrou/saiu quando
- Difícil cruzar com folha de pagamento ou apontamento de horas

**Mapeamento:** tabela `Alocacao` (pessoa × campanha × período).

### C) `Plano_de_ação - 5781 (Usiminas).xlsm`
**Função:** acompanhamento de ações pendentes da OS 5781 da Usiminas (uma obra específica).

**Estrutura observada:**
- Lista de ações (descrição, responsável, prazo, status)
- Macros VBA (botões para mudança de status, geração de relatórios)
- Reunião semanal: diretoria abre o arquivo, revisa, atualiza, salva.

**Replicado em 14 arquivos:** um por OS ativa. Cada um é uma cópia do template, com macros próprias.

**Limitações:**
- 14 arquivos = 14 fontes de verdade que podem divergir
- Macros VBA quebram com versões diferentes de Excel (Mac vs Windows)
- Reunião semanal centraliza o uso, mas dia-a-dia ninguém abre o arquivo
- Sem visão consolidada (ex.: "todas as ações em atraso da empresa toda")

**Mapeamento:** entidade `Acao` ligada polimorficamente a Campanha/OS/Obra. Workflow nativo de status. Dashboard consolidado para reunião semanal **substitui o ato de abrir 14 planilhas**.

---

## Decisão sobre escopo da F0/F1

**Excel operacional explicitamente FORA de escopo da semana atual** (que termina em 08/05 com a reunião com diretoria):

- Plano de Ação
- Efetivos
- Controle Sondas

**Razões:**
1. **Risco de data matching** — se o sistema mostrar números diferentes do Excel na demo, queima credibilidade.
2. **Scope blowout** — tentar absorver as 3 fontes Excel + RDO em 4 dias dá retrabalho garantido.
3. **Não é o gancho de venda** — o gancho é prejuízo evitado (Annex IV) e visão executiva (mapa + ficha + inteligência), não substituir planilha.

**Quando entram:** F1 (Plano de Ação como `Acao` polimórfica) e F2 (Efetivo + Sondas integrados ao RDO).

---

## Padrão de governança identificado

A reunião **semanal de obras** é um ritual estabelecido. Diretoria abre arquivo, revisa ações, atualiza status, salva.

**Oportunidade:** o sistema **deve preservar esse ritual**, não eliminá-lo.

**Mudança proposta:** mesma reunião, mas com:
- Tela única em vez de 14 abas Excel
- Filtros instantâneos (por cliente, por sonda, por responsável)
- Visão consolidada ("ações em atraso da empresa") como abertura
- Drill-down em 1 clique para a OS específica

Esse é um exemplo claro de **"sistema sabe mais que o diretor"** — mostra padrões que com 14 planilhas separadas não dá pra ver.

---

## Pontos de atenção

1. **VBA não vai migrar** — qualquer automação relevante precisa ser reimplementada no backend (FastAPI) ou frontend (React). Bom: oportunidade de auditar quais automações realmente importam.

2. **Versionamento de planilhas é caos** — cada cópia salva localmente diverge. O sistema novo precisa ter **fonte de verdade única** com trilha de auditoria.

3. **Excel oferece flexibilidade que sistema não vai oferecer** — usuário pode adicionar coluna nova no Excel a qualquer momento. Sistema vai ter campos fixos. Isso é **trade-off consciente**: rigidez controlada > flexibilidade caótica.

4. **Curva de adoção** — diretoria está acostumada a Excel. Treinamento e UX precisam ser respeitosos com isso, não tratar como "usuários atrasados".
