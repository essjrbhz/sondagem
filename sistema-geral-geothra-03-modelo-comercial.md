# Sistema Geothra — Modelo Comercial e Roadmap

**Última atualização:** 06/05/2026
**Reunião decisiva:** 08/05/2026, presencial em BH, com 2 diretores da Geothra

---

## Posicionamento profissional do Veio

**Identidade nova:** "Analista de domínio usando IA para entregar sistemas inteligentes."

- Não é dev, não é consultor tradicional, não é cientista de dados.
- É a **ponte** entre quem entende o problema (especialista de domínio) e quem executa (IA).
- A Geothra é o **primeiro caso flagship** desse posicionamento.

### Linguagem com diretores

- Sem jargão técnico, sem buzzwords de IA.
- Números concretos: R$, horas, %.
- Foco em **prejuízo evitado** e **decisão melhor**, não em "feature legal".
- Direto, sem rodeios. Diretores de classe média industrial não compram "promessa visionária", compram "problema resolvido".

### Princípio de venda

**Faça o cliente sentir o problema antes de falar do preço.** Ancore o valor (perda evitada), não o custo. R$ 35k parece muito até o diretor calcular que uma OS executada fora de escopo já custou R$ 17k em um caso documentado.

---

## Modelo comercial: contrato-mãe com OS

Espelha o modelo guarda-chuva que a própria Geothra pratica com Usiminas/Nexa. **Fala a língua deles.**

- Contrato-mãe com vigência de 18-24 meses
- Valor teto estimativo (sem garantia de execução total)
- Cada fatia é uma OS acionada quando a Geothra quiser seguir
- Cada OS tem escopo, prazo, valor e critério de aceitação próprios
- Aceitação formal (CAP/CAD) entre fatias
- Pagamento por fatia: **30% início / 40% meio / 30% fim**

---

## Fatias (F0–F5)

| Fatia | Escopo | Duração | Valor |
|---|---|---|---|
| **F0 — Descoberta** | Entrevistas com coordenador técnico, operador de campo, financeiro. Modelo de domínio validado. Backlog priorizado. Documento de arquitetura. | 4 sem | **R$ 35.000** |
| **F1 — Contratos e BM** | Cadastros, itens contratuais, eventos manuais, BM com memória de cálculo, ciclo de estados, exportação Tractebel. | 10-12 sem | **R$ 110.000** |
| **F2 — RDO estruturado + mobile offline** | Web + PWA, integração com eventos, fotos, GPS, assinatura, PDF idêntico ao atual. | 12-14 sem | **R$ 130.000** |
| **F3 — Apontamento de custo + P&L** | Custo direto por RDO, dashboards de margem por item/campanha/contrato/cliente. | 10-12 sem | **R$ 100.000** |
| **F4 — Boletim de sondagem + Relatório técnico** | Perfil técnico do furo, workflow de revisões, geração do relatório final com apêndices. | 10-12 sem | **R$ 95.000** |
| **F5 — Múltiplos clientes e exportações** | FIA/FAD Usiminas, FRS Nexa, integração Ariba Gerdau, pendências, marcos com alertas. | 8-10 sem | **R$ 80.000** |
| **Total se executado integral** | | 18-24 meses | **R$ 550.000** |

**F0 é não-negociável.** Sem F0, não há descoberta sólida; sem descoberta, F1 vai dar ruim.

**Prêmio do fatiamento:** ~15-20% sobre uma entrega única (R$ 450k seria o equivalente). É o preço justo da flexibilidade — Geothra pode parar em qualquer fatia.

---

## Lógica das fatias por capacidade entregue

Cada fatia adiciona uma **camada de inteligência** ao negócio:

```
F0: Descoberta                    → "entendemos o que executar"
F1: Contrato + Eventos + Medição  → "sabemos o que foi executado"
F2: + RDO + mobile                → "sabemos o que está sendo feito agora"
F3: + Custo + P&L                 → "sabemos onde ganhamos/perdemos"
F4: + Boletim + Relatório         → "sabemos entregar o que prometemos"
F5: + Multi-cliente + integrações → "sabemos escalar pra todos os clientes"
```

---

## Argumentos de venda (preparados para a reunião)

### 1. Demo de prejuízo evitado
Roteiro: abrir uma OS Vale ativa, tentar cadastrar um furo fora de escopo, sistema bloqueia em vermelho com mensagem clara. Diretor calcula sozinho: "se o caso conhecido foi R$ 17k, quantos casos não-conhecidos tivemos?".

### 2. Geothra do futuro (lado a lado)
Tela dividida: à esquerda, 4 abas de planilhas Excel + e-mail "alguém me passa a margem do Vale?". À direita, o sistema mostra a margem em 1 clique. **Sem fala. Só impacto visual.**

### 3. Profecia incômoda — Riscos Iminentes
Painel calculado com dados reais:
- "Contrato Magnesita vence em 47 dias e ainda não tem proposta de renovação"
- "Sonda X em manutenção há 23 dias acima do padrão"
- "Campanha OS-5781-02 atrasada em 18% sem ação registrada"

Diretor lê e pensa: **"isso aí ninguém me contou"**. Sistema sabe mais que ele. Esse é o gancho mais poderoso. **Tudo precisa ser verdade verificável** — se errar um dado, queima tudo.

### 4. Comparação financeira honesta
```
Custo de NÃO ter o sistema (estimativa conservadora):

  Caso documentado (1 ocorrência)............... R$  17.000
  Se 1x por trimestre por contrato ativo........ R$  68.000/ano
  × 14 contratos ativos......................... R$ 952.000/ano

  Outras perdas típicas (estudo PMI):
    Retrabalho por desinformação:     5% da receita anual
    Multas por atraso:                1-3% da receita anual
    Receita não-faturada (BM perdido): 2-5% da receita anual

  SE receita anual Geothra = R$ 30M:
    Perda estimada: R$ 2,4 a 4,2 milhões/ano

  Investimento total no sistema: R$ 550.000 (em 18-24 meses)
  ROI: payback em 3-6 meses (cenário conservador)
```

**Não inventar números.** Apenas fórmulas e estimativas baseadas no caso real documentado.

---

## Objeções esperadas e respostas

### "Posso fazer isso internamente"
Resposta: tempo e especialização. A equipe interna tem o conhecimento operacional, mas modelagem de banco e dashboards gerenciais exigem perfil técnico específico que raramente existe em empresa de sondagem. Quanto tempo até estar pronto? Quanto custa o atraso?

### "É muito caro"
Resposta: ancorar no prejuízo conhecido (R$ 17k). Mostrar conta de ROI. Comparar com 1 mês de uma equipe completa parada por desinformação.

### "Já tem o RDO funcionando"
Resposta: o sistema **não substitui** o RDO. **Estende** com a camada gerencial que falta. RDO continua sendo a fonte de execução em campo.

### "E se você sumir?"
Resposta: código no GitHub da Geothra (não do Veio). Documentação completa. Stack popular (FastAPI + React) — qualquer dev sênior assume. Possibilidade de transferir conhecimento para alguém da casa.

---

## Estratégia de longo prazo do Veio

**Fase 1 (meses 1-6): Consultoria/freelance**
- Geothra como caso flagship
- Outros clientes em saúde, financeiro/contábil, industrial/manufatura

**Fase 2 (meses 6-12): Produto próprio**
- A partir do aprendizado dos casos
- Possível SaaS para nichos similares à Geothra

**Fase 3 (meses 12-24): Escala**
- Meta: R$ 40k+/mês recorrente até meses 7-10
- Time pequeno, alavanca em IA

**Crença central:** na era da IA, conhecimento de domínio é mais valioso que conhecimento técnico.
