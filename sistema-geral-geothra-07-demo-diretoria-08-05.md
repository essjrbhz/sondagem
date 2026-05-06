# Sistema Geothra — Demo Diretoria 08/05/2026

**Última atualização:** 06/05/2026
**Reunião:** 08/05/2026 (sexta), presencial em BH
**Audiência:** 2 diretores da Geothra (35 e 48 anos, casados, classe média ascendente, provavelmente donos)
**Objetivo:** vender F0 (R$ 35k) + apresentar roadmap completo (R$ 550k)
**Plano completo:** `/mnt/user-data/outputs/geothra-demo-diretoria-plano.md`

---

## Janela de construção

| Dia | Janela | Status |
|---|---|---|
| Terça 05/05 | — | ✅ Sync RDO concluído (19 clientes, 36 equipamentos, 93 pessoas, 23 obras, 63 campanhas, 1.676 RDOs). Branch `feature/demo-diretoria` criada. |
| Quarta 06/05 | 7:15–11h | 🟡 Em andamento. Sync Furo/RDO/RDOFuro + 2 telas prioritárias. |
| Quinta 07/05 | a definir | Polimento, painel de inteligência, sincronia final. |
| Sexta 08/05 | manhã | Sync RDO uma última vez antes da reunião. Demo localhost no notebook. |

---

## Estado da branch `feature/demo-diretoria` no fim de 05/05

**Database populada via sync RDO:**
- 19 clientes
- 36 equipamentos (com tipos corrigidos)
- 93 pessoas
- 23 obras
- 63 campanhas
- (Furos, RDOs e RDOFuros pendentes — quarta de manhã)

**Telas e routers:** ainda não tocados.

**Pendências da quarta 06/05:**
1. Completar sync Furo / RDO / RDOFuro
2. Construir tela **Mapa Brasil** com KPIs
3. Construir tela **Ficha Consolidada de Obra**

**Pendências da quinta 07/05:**
4. Construir **Painel de Inteligência** (riscos iminentes)
5. Polimento visual, identidade Geothra
6. Roteiro da demo, ensaio mental

---

## As 3 telas-chave

### 6.1 Tela "Mapa do Brasil" — abertura da demo

**Rota:** `/mapa` (substitui `/` pós-login temporariamente)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Mapa Operacional Geothra"  [Sync: 08/05 09:30] 🔄│
├──────┬──────────────────────────────────────────────────────┤
│ KPIs │   ┌────────────────────────────────────────┐        │
│ KPIs │   │                                        │        │
│ KPIs │   │   MAPA DO BRASIL (Leaflet)             │        │
│ KPIs │   │   pins coloridos por status            │        │
│      │   │                                        │        │
│      │   └────────────────────────────────────────┘        │
│      │                                                     │
│      │   Lista lateral: obras por status crítico           │
└──────┴──────────────────────────────────────────────────────┘
```

**KPIs (4 cartões):**
- Obras ativas
- Campanhas em execução (pode virar "campanhas total" — qualquer status)
- Furos executados em maio/2026
- Receita estimada do mês

**Pins:**
- Verde — Em operação
- Amarelo — Em mobilização
- Vermelho — Pendência crítica
- Cinza — Concluído

**Comportamento:** clique em pin → navega para Ficha da Obra.

**Decisão de layout (tomada após primeira iteração):**
- Sem sidebar nessa tela (imersiva)
- Cards menores no topo (compactos)
- Auto-fit nos pinos (zoom automático)

**Geocoding:** lib local, baseada em `LocalExecucao` do RDO.

---

### 6.2 Tela "Ficha Consolidada de Obra" — drill-down

**Rota:** `/obras/:id`

**Conteúdo:**
- Cabeçalho: Cliente, Obra, número de contrato, gestor cliente, gestor Geothra
- KPIs da obra: campanhas ativas, furos executados, metros, receita acumulada
- Lista de campanhas com status, equipamento, equipe, % de conclusão
- Últimos RDOs (mini timeline)
- Pendências (placeholder em F0; ativo em F1)

**Objetivo emocional:** mostrar que **toda a informação da obra está em uma tela só**, sem precisar abrir 3 planilhas.

---

### 6.3 Tela "Painel de Inteligência" — fechamento da demo

**Rota:** `/inteligencia`

**Conteúdo:** **Riscos Iminentes** calculados a partir dos dados reais já no banco.

Exemplos plausíveis (todos verificáveis):
- "Contrato Magnesita vence em N dias, sem renovação registrada"
- "Sonda X em manutenção há M dias acima do padrão histórico"
- "Campanha OS-XXXX-XX atrasada em P% sem ação registrada"
- "Cliente Y sem RDO aprovado nas últimas Q semanas"

**Objetivo emocional:** "isso aí ninguém me contou". Sistema sabe mais que o diretor.

⚠️ **Crítico:** todo dado precisa ser **verdade verificável**. Um número errado queima a credibilidade da demo inteira.

**Prioridade na quinta:** se algo atrasar, é **essa tela** que se prioriza. Mapa + Ficha + Inteligência é o **trio mínimo**. Outros polimentos saem antes.

---

## Tela "Panorama Operacional" (em construção 06/05)

Tela complementar criada como dashboard executiva pós-login. Mostra:

- 4 KPIs (campanhas ativas, RDOs totais, metros executados, obras ativas)
- Bloco "Atenção Imediata" (clientes sem atividade > 30 dias, campanhas sem RDO > 7 dias)
- Tabela "Campanhas em Execução" com progresso de furos e último RDO

**Status visual em 06/05:**
- ✅ Layout estruturado, hierarquia clara
- ❌ Sem sidebar (não envolveu no `AppLayout`)
- ❌ Sem cores Geothra (usou verde/amarelo genéricos em vez de `primary` e `accent`)
- ❌ Header cinza genérico em vez do header Geothra

**Correção pendente:**
1. Envolver no `AppLayout` existente
2. Trocar cores hardcoded pelos tokens `primary`, `accent`, `gold`
3. Adicionar item "Panorama" na sidebar
4. Rota `/` redireciona para `/panorama` (substitui Dashboard temporariamente)

**Status no roadmap da demo:** posição ainda em definição. Pode ser substituída pelo Mapa Brasil como tela de abertura, ou ficar como segunda tela (executive dashboard).

---

## Roteiro da demo (rascunho)

### Abertura (5 min)
- Login → Mapa do Brasil
- "Esses são todos os locais onde a Geothra está executando agora"
- Click em pin de uma obra com pendência crítica → abre Ficha

### Drill-down (10 min)
- Ficha da Obra (cliente conhecido, dados reais)
- "Aqui está tudo o que você precisaria das 3 planilhas em uma tela"
- Mostrar histórico de RDOs, campanhas, equipamentos

### Demo de prejuízo evitado (10 min)
- Tentar cadastrar furo fora de escopo
- Sistema bloqueia em vermelho
- "O caso de R$ 17k não teria acontecido"
- Pausa para diretores processarem

### Painel de Inteligência (10 min)
- Riscos Iminentes
- "Isso é calculado automaticamente, ninguém precisa montar"
- Diretores comparam mentalmente com Excel atual

### Fechamento comercial (10 min)
- Roadmap em 1 slide (F0–F5, R$ 35k → R$ 550k)
- Foco em F0 (R$ 35k, 4 semanas, descoberta)
- "F0 é o piloto. Vocês decidem se F1 segue depois."
- Espaço para perguntas

**Tempo total:** 45 min com perguntas curtas. Demo pura: 25 min.

---

## Princípios de execução

1. **Demo localhost.** Não depende de internet. Sync RDO foi feito de manhã.
2. **Dados reais, não mock.** Cliente "Magnesita" só aparece se Magnesita está mesmo no RDO.
3. **Estrutura primeiro, polimento depois.** Se a tela não estiver bonita mas os dados estiverem corretos, OK. Se a tela estiver linda mas com número inventado, **fim de jogo**.
4. **Sem AI buzzword.** Diretores não compram "IA"; compram "lucro maior" e "menos dor de cabeça".
5. **Sem jargão técnico.** Nada de "FastAPI", "PostgreSQL", "TanStack Query". Falar do **valor**.

---

## Saída esperada da reunião

**Cenário ideal:** F0 fechada na hora ou em 5 dias úteis. Pagamento 30/40/30 (R$ 10,5k início + R$ 14k meio + R$ 10,5k fim).

**Cenário aceitável:** diretores pedem proposta formal por escrito. Veio entrega em 2 dias. F0 fechada em 2-3 semanas.

**Cenário ruim:** diretores acham caro ou pedem desconto. Veio mantém preço (F0 não-negociável) e propõe extender prazo de pagamento.

**Cenário pior:** "vamos pensar". Veio agenda follow-up em 7 dias com 1 pergunta concreta. **Não deixar virar mês.**
