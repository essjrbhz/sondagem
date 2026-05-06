# Sistema Geothra — Integração RDO / SharePoint / Microsoft Graph

**Última atualização:** 06/05/2026

---

## O que é o RDO

**RDO** = Relatório Diário de Obra. É a camada de **execução em campo** da Geothra hoje. Construído em **Power Apps** sobre **SharePoint**, no tenant `geothrageologia.sharepoint.com/sites/apprdo`.

**37 listas SharePoint** compõem o RDO. A lista principal é `GD_RDO` com **53 colunas**.

O RDO continua existindo após o sistema novo. Ele é a **fonte de verdade da execução de campo**. O sistema novo é a **fonte de verdade da camada gerencial** (contrato, OS, campanha, BM, P&L).

---

## Arquitetura de integração

```
┌──────────────────────────┐
│  Power Apps (RDO)        │
│  preenchido em campo     │
└────────────┬─────────────┘
             │ grava em
             ▼
┌──────────────────────────┐         ┌────────────────────────────┐
│  SharePoint              │         │  Microsoft Graph API       │
│  geothrageologia.sp.com  │ ◄────── │  /sites/apprdo/lists/...   │
│  /sites/apprdo           │  read   │  (autenticado app reg)     │
└──────────────────────────┘         └────────────┬───────────────┘
                                                  │ sync
                                                  ▼
                                     ┌────────────────────────────┐
                                     │  Sistema Geothra           │
                                     │  PostgreSQL                │
                                     │  (camada gerencial)        │
                                     └────────────────────────────┘
```

**Fluxo:**
1. Equipe de campo preenche RDO no Power Apps (offline-capable do próprio Power Apps).
2. Power Apps grava em listas SharePoint.
3. Sistema Geothra puxa via Microsoft Graph API (read-only inicialmente).
4. Sistema Geothra normaliza e armazena em modelo relacional próprio.
5. Idempotência via campo `idce_*` em cada tabela (rastreia origem SharePoint).

---

## App Registration (Azure AD)

**Permissões application (admin consent dado):**
- `Mail.Read`
- `Sites.Read.All`
- `Files.Read.All`
- `User.Read.All`

**Autenticação:** client credentials flow (sem usuário). App ID e secret armazenados em variáveis de ambiente do backend.

---

## MCP Microsoft Graph

Configurado em Docker no Mac do Veio. Expõe ferramentas de email e SharePoint para o ecossistema Claude.

**Exposição externa:** Cloudflare tunnel.
- **Estado atual:** tunnel volátil (URL muda a cada restart)
- **Próximo passo:** migrar para named tunnel (URL fixa)

Usado também para tarefas administrativas de M365 (Veio é admin do tenant Geothra).

---

## Pipeline de sync (`backend/services/sync_rdo.py`)

Pipeline modular com `SyncReport` que retorna:
- `criados`
- `atualizados`
- `skipped`
- `erros`

**Ordem de execução:**
1. `sync_clientes()` — lista de clientes do RDO (campo `idce_cliente`)
2. `sync_equipamentos()` — sondas, percussões, trados etc.
3. `sync_pessoas()` — usuários do RDO (sondadores, geólogos, etc.) → mapeia para `Usuario`
4. `sync_obras()` — projetos do RDO
5. `sync_campanhas()` — frentes do RDO
6. `sync_furos()` — furos cadastrados
7. `sync_rdos()` — registros diários
8. `sync_rdo_furos()` — atividade dos furos no dia

**Idempotência:** cada entidade tem coluna `idce_*` (ID externo do SharePoint). Pipeline pode rodar quantas vezes quiser sem duplicar.

---

## Dados sincronizados (estado em 05/05/2026, fim de terça)

| Entidade | Criados | Atualizados | Total |
|---|---|---|---|
| Clientes | 19 | 0 | 19 |
| Equipamentos | 36 | 0 | 36 |
| Usuários (pessoas) | 0 | 93 (já existiam) | 93 |
| Obras | — | — | 23 |
| Campanhas | — | — | 63 |
| RDOs totais (visíveis na tela) | — | — | 1.676 |

**Tipos de equipamento identificados:**
- `sonda`
- `percussao`
- `trado_mecanico`
- `trado_manual`
- `cptu`
- `mach700`
- `tripe` (adicionado em 05/05)
- `trado` (genérico, adicionado em 05/05)
- `radar_penetracao` (adicionado em 05/05)
- `resistividade` (adicionado em 05/05)

**Migration aplicada:** `expande_tipo_equipamento` (Postgres `ALTER TYPE ADD VALUE IF NOT EXISTS` — downgrade vazio é limitação do Postgres, não preguiça).

---

## Mapeamento RDO → Sistema (campo a campo)

| Campo RDO (SharePoint) | Tabela/coluna sistema | Notas |
|---|---|---|
| `Cliente` | `clientes.nome` | normalização |
| `idce_cliente` | `clientes.idce` | chave de idempotência |
| `Logotipo_cliente` | `clientes.logotipo` | URL do SP |
| `OS` (Frente) | `campanhas.codigo_frente` | frente sem agregação |
| `LocalExecucao` | `obras.local_execucao` | usado para geocoding |
| `CentroCusto` | `obras.centro_custo` | sub-CC para campanha |
| `NumeroContrato` | `obras.numero_contrato` | |
| `ObjetoContrato` | `obras.objeto_contrato` | |
| `GestorCliente` | `obras.gestor_cliente` | |
| `GestorGeothra` | `obras.gestor_geothra` | |
| `DataInicio` | `obras.data_inicio` | |
| `DataTermino` | `obras.data_termino` | |
| `Status` | `obras.status` | |

---

## Coordenadas geográficas

**Estratégia:** geocoding **local** (não API externa).

Razão: demo presencial 08/05 não pode depender de internet. Usar lib local (geocoder, geopy + cache) com cidades brasileiras conhecidas. Apenas cidades populadas (~5500 cidades) — cobertura suficiente para os locais de obra.

**Campo de origem:** `LocalExecucao` no RDO. Parser identifica cidade + estado, faz lookup no cache, retorna lat/lng.

---

## Refatorações pendentes para suportar o RDO

1. **`Projeto` (legado)** precisa ganhar campos do RDO: `centro_custo`, `numero_contrato`, `objeto_contrato`, `gestor_cliente`, `gestor_geothra`, `data_inicio`, `data_termino`, `status`, `cliente_idce`.

2. **Relação `Projeto ↔ Sonda` (1:1 hoje)** vira N:N via Campanha. 1 obra tem N campanhas, cada uma tem 1 sonda principal (mais sondas substitutas no histórico).

3. **Furos no `Projeto` (hoje)** vão migrar para `Campanha`. Migração de dados necessária — furos antigos sem campanha precisam de uma "campanha legado" para não perder a referência.

---

## Webhooks (futuro, não implementado)

SharePoint suporta webhooks via Microsoft Graph (notification subscriptions). Quando estável, substituir polling/sync periódico por evento push:

- RDO criado → sistema dispara recálculo de KPIs da obra
- RDO editado → sistema atualiza ficha
- Furo concluído → sistema verifica se BM precisa ser atualizado

**Limitação atual:** subscriptions Graph para SharePoint têm TTL máximo curto (3 dias) — precisa renovação automática. Não é blocker, é complexidade adicional para depois da F1.

---

## Riscos e mitigações

### Risco: SharePoint mudar estrutura de coluna
**Mitigação:** sync defensive — campo ausente vira null, log de warning. Não quebra o pipeline inteiro por uma coluna sumida.

### Risco: tunnel Cloudflare cair durante demo
**Mitigação:** sync RDO **antes** da demo (uma vez, na manhã do dia). Demo roda em localhost com dados já no Postgres. Não depende do tunnel ao vivo.

### Risco: dados RDO inconsistentes (cliente sem nome, OS duplicada)
**Mitigação:** sync com validação. Casos inválidos vão para `SyncReport.erros` e não entram no banco. Log para revisão manual.
