# Sistema Geothra — Visão Geral e Arquitetura

**Última atualização:** 06/05/2026
**Empresa:** Geothra (Geologia & Geotecnia) — Belo Horizonte, MG
**Negócio:** sondagem geotécnica, geofísica, topografia, instrumentação, ambiental
**Repositório:** github.com/essjrbhz/sondagem (público)
**Branch ativa:** `feature/demo-diretoria`

---

## Propósito do sistema

Sistema web de gestão de projetos para Geothra. Atende todos os níveis: diretoria, coordenação técnica, equipes de campo. Estende um repo existente (não cria do zero), aproveitando código já feito e reduzindo retrabalho.

A premissa estratégica é que o **conhecimento de domínio profundo** (entender o negócio de sondagem, contratos guarda-chuva, BMs, RDOs, pendências) vale mais que o conhecimento técnico — a IA é o desenvolvedor; o humano é a ponte entre domínio e execução.

---

## Hierarquia de domínio (modelo conceitual fechado)

```
Cliente
  └── Contrato
        └── OS (Ordem de Serviço)
              └── Campanha (= Frente do RDO)
                    └── Furo / Ensaio
                          └── Evento de Execução
```

### Decisões arquiteturais já fechadas

1. **Sistema novo é fonte de verdade** para Cliente, Contrato, Obra, OS, Campanha. O RDO existente (Power Apps + SharePoint) continua como **camada de execução em campo** — não é substituído na F0/F1.

2. **Vocabulário híbrido (caminho 3):** UI usa "Campanha", mas o sistema armazena o código de "Frente" do RDO como atributo. Isso preserva continuidade pra equipe de campo sem confundir o vocabulário gerencial.

3. **Frente com sufixo letra** (`OS-5781-02` + `OS-5781-02A`) = **mesma OS, equipes diferentes** = campanhas distintas no sistema.

4. **OS contratual é DERIVADA** por agrupamento das Frentes pelo número-base. A tabela OS existe na migration mas é nullable/não usada até F1.

5. **Modelo de Campanha:** 1 campanha = 1 equipamento + 1 equipe + 1 lista de furos. O equipamento pode ser substituído ao longo da campanha (ela sobrevive à troca). Identificador formal é o sub-CC (ex.: `5507.01`, `5507.02`).

6. **Obra** = renomeação semântica de `Projeto` na UI. A classe Python permanece `Projeto` por enquanto.

---

## Arquétipos contratuais

Identificados a partir da análise de 5 contratos reais (Usiminas/MUSA, Anglo, Vale, Gerdau, Samarco):

### Guarda-chuva (umbrella)
**Exemplo:** Usiminas/MUSA (R$ 18,4M, 30 meses, 87 itens)
- Prazo longo, múltiplos projetos sob 1 contrato
- Autorização por OS (ADP — Autorização de Despesa de Projeto)
- Risco principal: **execução fora de escopo** (caso documentado: R$ 17k perdidos)
- Sistema de pendências polimórfico necessário
- P&L por item contratual é o valor estratégico central

### Escopo fechado de curta duração
**Exemplos:** Vale (R$ 1,4M / 6 meses), Gerdau (R$ 450k / 4 meses)
- Projeto bem definido, valor fechado, medição mensal
- Menos complexidade de gestão
- Receita menos previsível (precisa de pipeline contínuo)

---

## Cinco tipos de pendências (linkagem polimórfica)

1. **Técnicas** — laudos pendentes, ensaios não conformes
2. **Documentais** — ART não emitida, documento faltante
3. **Contratuais** — aditivos pendentes, divergência de escopo
4. **Aceitação** — BM não aprovado pelo cliente
5. **Ações** — itens de plano de ação (do Plano_de_Ação.xlsm)

---

## Capacidade estratégica central

**P&L por item contratual** foi identificado como o diferencial principal. Permite responder:

- Qual o lucro real de cada item do Annex IV?
- Em qual cliente estamos perdendo dinheiro?
- Em qual tipo de serviço estamos ganhando?
- A renovação do contrato MUSA faz sentido nos preços atuais?

Excel de hoje **não consegue** responder isso de forma confiável.

---

## Princípios guia

- **Estrutura primeiro, polimento depois.** Não vender feature bonita sem fundação sólida.
- **Tempo máximo em planejamento conceitual antes de código.**
- **Estudo comparativo de múltiplos contratos** para identificar padrões estruturais (não generalizar a partir de um só).
- **Crítica honesta acima de validação.** Veio prefere apontamento direto a elogio fácil.
- **Sequencial, decisão por decisão.** Não despejar opções todas de uma vez.

---

## Próximas evoluções esperadas

- F1 ativa a tabela OS, BMs, ciclo de medição
- F2 traz mobile offline (PWA) pra preenchimento em campo
- F3 adiciona apontamento de custo direto no RDO → P&L automático
- F4 estrutura boletim de sondagem + relatório técnico
- F5 expande para múltiplos clientes com exportações específicas (FIA/FAD Usiminas, FRS Nexa, Ariba Gerdau)
