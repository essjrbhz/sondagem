# Sistema Geothra — Integrações Futuras

**Última atualização:** 06/05/2026

Este arquivo cataloga **integrações estudadas** mas **ainda não implementadas**. Não é roadmap fechado — é mapa de possibilidades para decisão futura.

---

## 1. Omie ERP (estudo iniciado em 06/05)

A Geothra usa Omie como ERP. A integração futura entre o sistema novo e o Omie levanta uma decisão estrutural: **quem é fonte de verdade para cada entidade?**

### Características técnicas

- **Protocolo:** SOAP/JSON via POST apenas (sem REST clássico, sem GET).
- **REST com Swagger** está sendo desenvolvido pela Omie, mas ainda não lançado.
- **Autenticação:** App Key + App Secret por aplicativo Omie.
- **Endpoint base:** `https://app.omie.com.br/api/v1/...`
- **Webhooks:** disponíveis para notificação push em tempo real.
- **Rate limit:** existe (valor exato a confirmar).
- **Paginação:** obrigatória nas listagens, baseada em offset (não cursor).
- **Documentação:** `https://developer.omie.com.br/`

### Módulos Omie relevantes para Geothra

#### Cadastros que já temos no sistema (risco de duplicidade)
- `geral/clientes/` — Cliente/Fornecedor
- `geral/projetos/` — Projetos (mapeia para Obra ou separado)
- `geral/vendedores/`

#### Coração do negócio (prestação de serviço)
- `servicos/servico/` — Catálogo de serviços
- `servicos/os/` — **Ordens de Serviço**
- `servicos/osp/` — Faturamento de OS
- `servicos/oslote/` — Faturamento em lote
- `servicos/contrato/` — **Contratos de Serviço com recorrência** (mapeamento natural pro contrato MUSA)
- `servicos/contratofat/` — Faturamento do contrato
- `servicos/nfse/` — Consulta NFS-e emitidas
- `servicos/osdocs/` — PDF/XML dos documentos fiscais

#### Financeiro
- `financas/contareceber/` — Contas a Receber
- `financas/contareceberboleto/` — Boletos
- `financas/contareceber/pix/` — PIX
- `financas/mf/` — Movimentos Financeiros
- `financas/extrato/` — Extrato

#### CRM (pipeline)
- `crm/contas/`, `crm/contatos/`, `crm/oportunidades/`, `crm/tarefas/`

#### Outros úteis
- `geral/anexo/` — anexar documentos a registros (RDO assinado, ART, laudo)
- `geral/clientetag/`, `geral/clientescaract/` — classificação custom
- `geral/categorias/`, `geral/dre/` — plano de contas, DRE por obra

### 4 padrões de integração possíveis

1. **Espelho read-only** — Omie é fonte de verdade do que já é dele (cliente, financeiro, fiscal); sistema novo só lê via API quando precisa.
2. **Espelho write-through** — sistema novo é a interface; cada operação relevante grava nos dois.
3. **Sync periódico** — job que reconcilia estados de tempos em tempos, com regra de precedência por entidade.
4. **Event-driven via webhook** — Omie notifica mudanças, sistema reage; sistema notifica Omie quando precisa.

Cada um responde diferente a perguntas tipo "e se cair a rede no momento do faturamento?", "e se o usuário editar nos dois lugares?", "quem ganha em conflito?".

### Status da decisão

**Em estudo. Nenhuma decisão tomada.** Próximo passo: entender como o Omie é usado hoje na Geothra (quem alimenta, qual frequência, quem são os usuários, o que sai para o contábil).

---

## 2. Microsoft Graph / SharePoint (já implementado parcialmente)

Ver arquivo `06-integracao-rdo-sharepoint.md`. Já está em produção para sync RDO. Possíveis evoluções:

### Email (Mail.Read)
- Anexar emails recebidos a um Cliente/Obra automaticamente
- Detectar assuntos críticos (notificação de aceitação de BM, pendências)
- Arquivamento estruturado por OS

### Files (Files.Read.All)
- Indexar laudos PDF, ART, ATJ por obra
- Extração de texto + busca semântica
- Versionamento automático

### Sites (Sites.Read.All)
- Outras listas SharePoint além do RDO (qualidade, segurança, RH)
- Federação de fontes de dados

---

## 3. WhatsApp Business

Estudado, não decidido. Plataformas avaliadas:
- **Oficiais:** Zenvia, OmniChat, Huggy, Blip, Gupshup
- **Não oficiais:** Z-API, Evolution API (open source), WPPConnect

**Casos de uso potenciais:**
- Notificar gestor cliente sobre conclusão de furo
- Enviar BM para aprovação por WhatsApp (com link assinado)
- Alertas de risco para diretoria (pendências críticas)
- Bot de consulta para sondador em campo ("qual o próximo furo?")

**Risco:** plataformas não oficiais podem ter número banido pela Meta. Para uso corporativo Geothra, recomendado **API oficial** apesar do custo.

**Status:** não há demanda ativa. Estudar quando F2 (mobile field) estiver perto.

---

## 4. Integrações específicas por cliente (F5)

Cada cliente grande tem seu próprio formato de medição/aceitação:

### Usiminas — FIA/FAD
**FIA** (Folha de Indicação de Aceitação) e **FAD** (Folha de Aceitação Definitiva). Templates Excel específicos. Sistema precisa exportar BM no formato exato.

### Nexa — FRS
**FRS** (Folha Resumo). Template específico, regras de medição diferentes.

### Gerdau — Ariba
**SAP Ariba** é o portal de fornecedores da Gerdau. Faturamento e medições passam por ele. Possível integração via API Ariba (não há decisão).

### Vale — formato próprio
A confirmar.

### Anglo American — formato próprio
A confirmar (contrato 48 meses, geofísica).

**Status:** Todas planejadas para F5. R$ 80k em 8-10 semanas.

---

## 5. Tracejamento contábil (futuro)

A Geothra tem contador externo. Painel do Contador do Omie expõe XMLs fiscais (`contador/xml/`). Possível integração:

- Sistema Geothra puxa NF-e/NFS-e emitidas
- Cruza com BMs aprovados
- Aponta divergências (BM aprovado sem NF emitida, NF emitida sem BM)
- Exporta DRE/balanço por contrato/obra

**Valor:** auditoria automática mensal. Reduz risco de erro fiscal.

---

## 6. Instrumentação geotécnica (longo prazo)

Geothra também presta serviço de instrumentação (piezômetros, inclinômetros, marcos). Sensores podem reportar leituras automaticamente.

**Volume estimado:** 1 leitura a cada 5min × N sensores = volume alto.

**Stack adicional necessária:** TimescaleDB (extensão Postgres) para séries temporais.

**Casos de uso:**
- Monitoramento contínuo de talude
- Alerta automático em desvio de leitura
- Dashboard para equipe técnica do cliente

**Status:** fora de F0–F5. Possível extensão "F6" ou produto adicional.

---

## 7. EQUIPAMENTOS (sistema interno separado)

Veio mantém o repo `essjrbhz/equipamentos` — sistema interno de **asset management e manutenção**, em **Django + Templates + Tailwind + HTMX**. Diferente do sistema Geothra principal.

**Possível integração futura:**
- Sistema EQUIPAMENTOS é fonte de verdade do **estado físico** (manutenção, calibração)
- Sistema Geothra consome o estado para validar disponibilidade na alocação de campanhas
- Comunicação por API REST (Django expõe endpoints, FastAPI consome)

**Status:** dois sistemas separados por enquanto. Decisão de unificar/integrar pode vir após F2.

---

## Princípio guia para integrações

**Cada integração precisa responder a uma pergunta de negócio.**

- "Por que vamos integrar com Omie?" → "Para parar de redigitar cliente em dois sistemas e ter conciliação contábil automática."
- "Por que webhook no SharePoint?" → "Para o sistema mostrar dado novo do RDO em segundos, não em horas."
- "Por que WhatsApp?" → "Para o gestor cliente aprovar BM sem precisar abrir o sistema."

**Sem pergunta clara de negócio, não há integração.** Integrações são caras de manter; cada uma precisa pagar o custo dela.
