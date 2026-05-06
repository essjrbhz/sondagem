# Sistema Geothra — Análise de Contratos

**Última atualização:** 06/05/2026
**Princípio:** estudo comparativo de múltiplos contratos identifica padrões estruturais — não generalizar a partir de um.

---

## Contratos analisados

| Cliente | Proposta | Data | Valor | Prazo | Natureza |
|---|---|---|---|---|---|
| **Usiminas/MUSA** | Anexo IV | 2023-2026 | R$ 18,4M | 30 meses | Guarda-chuva multiprojetos |
| **Anglo American** | PP 6555 Rev00 | Jul/2025 | R$ 3,24M | 48 meses | Geofísica |
| **Vale** | PP 4305 Rev04 | Ago/2022 | R$ 1,4M | 6 meses | Sondagem/ensaios |
| **Gerdau** | PP 6618 Rev02 | Nov/2025 | R$ 450k | 4 meses | Controle tecnológico |
| **Samarco** | PP 4860 Rev01 | Out/2022 | N/D | 12 meses | Controle tecnológico |
| **Tractebel** | (real RDO+BM) | — | — | — | Sondagem |
| **Nexa** | (analisado) | — | — | — | FRS — Folha Resumo |

**Volume total identificado:** R$ 23,09M (excluindo Samarco e contratos sem valor declarado).

**Próximos a analisar:** CSN, Gerdau (mais frentes), Anglo, Samarco.

---

## Análise profunda do contrato MUSA (Usiminas)

### Estrutura

- **Contrato principal** (cláusulas gerais): 30 meses, ~R$ 18,4M umbrella
- **Reference técnica:** 86 páginas com SLA e penalidades até 10% do faturamento mensal
- **Proposta técnica Geothra:** 129 páginas
- **Anexo IV:** 87 itens, 6 unidades de medida (Verba, Mês, HH, HM, Metro, Unidade/CP)

### Riscos identificados no contrato principal

1. **Sem garantia de faturamento mínimo** — contrato não obriga MUSA a executar volume mínimo. Geothra pode vender capacidade ociosa que nunca vira receita.
2. **Preços fixos sem reajuste** — em 30 meses de contrato, sem cláusula de inflação.
3. **Penalidades em cascata** — descumprir SLA gera desconto que cresce com o tempo.
4. **Responsabilidade ilimitada** — sem teto de indenização em caso de incidente.

### Reference técnica (86 pgs)

- SLA por tipo de serviço com indicadores específicos
- Penalidades graduais até 10% do faturamento mensal
- Métrica de aceitação por entrega

### Proposta técnica Geothra (129 pgs) — fragilidades identificadas

- **Lista de desvios vazia** (passividade comercial — aceitou tudo sem ressalvas)
- **Declaração de equipe subdimensionada** (formal mas pouco realista)
- **Sem metodologia de SLA** (não diz como vai medir/garantir os indicadores que o cliente exige)

### Caso documentado: a perda de R$ 17k

Serviço executado fora de escopo (fora do Annex IV) sem autorização ADP prévia. Cliente recusou pagamento na conferência de medição. Geothra absorveu o prejuízo.

**Esse caso é a âncora central** da venda do sistema:
- Sistema bloqueia execução fora de escopo antes de virar custo
- Sistema gera ADP automaticamente quando há desvio
- Sistema preserva trilha de aprovação

### Cinco naturezas de serviço (operacionalmente distintas)

Identificadas no Anexo IV:

1. **Sondagem rotativa** (metro perfurado)
2. **Sondagem percussiva** (metro perfurado)
3. **Ensaios** (unidade)
4. **Mobilização/desmobilização** (verba)
5. **Equipe técnica** (mês ou HH)

Cada natureza tem **regra de medição diferente**, **exigência documental diferente** e **risco operacional diferente**. O sistema precisa modelar isso, não tratar tudo como genérico.

---

## Padrões estruturais comuns identificados

### Em contratos guarda-chuva
- Autorização por OS/ADP é universal
- Annex IV (ou equivalente) define o catálogo de serviços e preços
- Medição mensal ou quinzenal
- Sistema de pendências para resolver divergências sem travar pagamento

### Em contratos de escopo fechado
- Preço total fixo com cronograma de pagamento
- Marcos contratuais (mobilização → execução → desmobilização)
- Boletim de medição (BM) por marco

### Em todos
- Existe a figura do **gestor cliente** e **gestor Geothra**
- Existe a figura do **fiscal técnico** que valida laudos
- Sempre tem **número de centro de custo** ou equivalente
- Sempre tem **objeto de contrato** descritivo

---

## Boletim de Medição (BM) — análise estrutural do Excel atual

### Falhas estruturais do processo Excel atual

1. **Risco de double-billing** — sem validação cruzada, mesmo evento pode ser medido em dois BMs
2. **Sem trilha de mudanças** — Rev01 sobrescreve original sem histórico de "o que mudou"
3. **Consistência cross-sheet frágil** — totais em uma aba dependem de outra; quebra silenciosa
4. **Não escala para múltiplos clientes** — cada cliente tem template próprio, não há fonte de verdade comum

### Decisão de modelo

**BM não é documento — é consulta derivada.** O BM é uma **query** sobre os eventos de execução já lançados, com filtros (período, OS, item contratual). Imprimir o BM é gerar PDF da query.

Isso elimina:
- Double-billing (cada evento só pode estar em um BM aprovado)
- Falta de trilha (versão = snapshot da query em determinada data)
- Inconsistência (única fonte de verdade)

---

## Pendências — modelo polimórfico

Cinco tipos identificados, todos linkáveis a múltiplas entidades (Furo, Campanha, OS, Contrato):

1. **Técnicas** — laudo pendente, ensaio não conforme
2. **Documentais** — ART não emitida, doc faltante
3. **Contratuais** — aditivo pendente, divergência de escopo
4. **Aceitação** — BM não aprovado pelo cliente
5. **Ações** — itens de plano de ação (vindos do Plano_de_Ação.xlsm)

Modelo polimórfico permite:
- Pendência de aceitação ligada a um BM ou a um Furo
- Pendência técnica ligada a uma Campanha ou a uma OS
- Mesma estrutura, diferentes contextos

---

## Outputs salvos da análise

- `/mnt/user-data/outputs/anglo_pp6555_analise.md`
- Análise consolidada dos 5 clientes mineradores
- Análise dos 3 arquivos âncora da Gestão OBRAS (ver arquivo `05`)

---

## Próximos passos da análise contratual

- Coletar contrato CSN (próximo cliente prioritário)
- Reanalisar Samarco com valor declarado
- Comparar Annex IV de 5+ contratos para identificar **catálogo comum de serviços**
- Mapear regras de medição por cliente (FIA/FAD Usiminas, FRS Nexa, Ariba Gerdau)
