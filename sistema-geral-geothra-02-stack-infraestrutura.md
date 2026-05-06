# Sistema Geothra — Stack Técnico e Infraestrutura

**Última atualização:** 06/05/2026

---

## Stack escolhida (e justificativa)

### Backend

- **FastAPI 0.115** — maduro, rápido, tipado (Pydantic), gera OpenAPI automático. Alta produtividade com Claude Code.
- **SQLAlchemy 2.0** — ORM moderno, sintaxe type-safe.
- **Alembic** — migrations versionadas.
- **Pydantic** — validação de entrada/saída.
- **JWT** (python-jose + passlib/bcrypt) — auth com roles `admin`, `gerente`, `tecnico`. Token expira em 8h.
- **psycopg2** — driver Postgres.

**Alternativa considerada e descartada:** Django + DRF. Mais "baterias incluídas", mas menos flexibilidade arquitetural. FastAPI é mais ágil pra um analista de domínio sozinho com IA.

### Banco

- **PostgreSQL 16** — escolha óbvia. Maturidade, ecossistema, JSON nativo.
- **PostGIS** — extensão para dados geoespaciais (coordenadas de furos, mapeamento).
- **TimescaleDB** considerado para futuro (instrumentação contínua, leituras de piezômetro a cada 5min) — extensão do próprio Postgres, não fragmenta o ecossistema.

### Frontend

- **React 19 + TypeScript** — TS é não-negociável para um sistema com essa complexidade de domínio.
- **Vite** — bundler (CRA está morto).
- **Tailwind CSS v3** — styling utilitário.
- **TanStack Query** — data fetching com cache.
- **TanStack Table** — grids pesados (BMs, listas de furos).
- **Recharts** — gráficos.
- **React Router 7** — roteamento.
- **shadcn/ui** — componentes base copiados (não library), controle total.
- **Leaflet + react-leaflet** — mapas (planejado para tela do Mapa Brasil).

### Mobile de campo

- **PWA (Progressive Web App)** — não app nativo. RDO precisa funcionar offline em campo, com sync quando voltar a internet. Decisão tomada pra evitar a dor de manter dois apps nativos (iOS + Android).

### Infraestrutura

- **Docker Compose** com profile dev (hot-reload).
- Containers ativos:
  - `sondagem_db` — PostgreSQL 16, healthy, porta 5432
  - `sondagem_backend` — FastAPI + Uvicorn, porta 8088 (8000 ocupada por outro projeto local)
  - `sondagem_frontend` — nginx com build React, porta 80
  - `sondagem_frontend_dev` — Vite hot-reload, porta 5173

---

## Identidade visual Geothra (já configurada no Tailwind)

Tokens disponíveis em `tailwind.config.js`:

- `primary`: `#003440` — azul-petróleo escuro
- `accent`: `#E6D352` — amarelo-mostarda
- `gold`: `#B29312` — dourado

**Uso esperado:** títulos e headers em `primary`, destaques e badges em `accent`, detalhes refinados em `gold`. Estados de erro/alerta usam vermelho utilitário, mas o visual base deve sempre transmitir identidade.

---

## Estrutura do projeto (estado atual da branch)

### Modelos existentes (`backend/models.py`)
- `Cliente`
- `Sonda`
- `Projeto`
- `Furo`
- `AtividadeFuro`
- `Usuario`
- `Equipamento` (sondas, percussão, trados, tripé, trado, radar, resistividade — Enum expandido em 05/05)

### Routers existentes
- `/auth/login`
- `/usuarios/`
- `/clientes/`
- `/sondas/`
- `/projetos/`
- `/furos/`
- `/atividades/`
- `/dashboard/`

### Páginas frontend existentes
- Login
- Dashboard
- Projetos
- Furos
- Relatórios
- Panorama Operacional (em construção, branch atual)

### Componentes de layout (já prontos)
- `AppLayout` — layout padrão com sidebar + header + conteúdo
- `Sidebar` — navegação lateral
- `Header` — header com identidade Geothra

**Importante:** páginas novas devem **envolver no `AppLayout`** existente para herdar sidebar e header. Não criar layouts novos.

---

## Ambiente de desenvolvimento

### Máquinas

- **Mac** (principal de desenvolvimento) — projeto em `/Users/essjr/Documents/_PROJETOS/SISTEMAS/gestao-geothra`
- **`deepcore-ia`** (Linux Ubuntu, GPU CUDA) — produção e workloads de IA (HGSOC etc.)
- **VM Ubuntu Linux** (Hyper-V no Windows) — Docker, CUDA/nvidia-docker

### Tooling

- **Claude Code** — instalado em Mac e Linux. PATH `~/.local/bin` resolvido.
- **Tailscale** — conectividade entre máquinas (atenção: Windows está em conta diferente do Mac/VM).
- **Git** — configurado no Mac. Repos no GitHub `essjrbhz/`.
- **GitHub** — `essjrbhz/sondagem` (Geothra principal), `essjrbhz/equipamentos` (sistema interno asset/manutenção, Django + Templates + Tailwind + HTMX).
- **OPNsense API** — integração para 3 ambientes (Geothra primeiro, em `192.168.15.1:80` HTTP). Scripts em `~/Documents/opnsense/scripts/`.

### MCPs configurados

- **MCP Microsoft Graph** — App Registration com permissões `Mail.Read`, `Sites.Read.All`, `Files.Read.All`, `User.Read.All` (application permissions, admin consent dado). Exposto via Cloudflare tunnel (volátil — migrar para named tunnel a longo prazo).
- **Multi-agent Docker** planejado: `/home/projetos` como volume compartilhado, Docker socket bind mount (DooD), agentes Claude, OpenClaude, Codex, Qwen.

---

## Workflow de desenvolvimento com Claude Code

### Princípios

- Reaproveitar código existente (AppLayout, Sidebar, Header, tokens de tema). **Não criar layouts novos.**
- Usar **apenas tokens do `tailwind.config`** (`primary`, `accent`, `gold`). Sem cor hardcoded fora desses tokens (exceto vermelho/cinza utilitários).
- Seguir padrões já estabelecidos em outras páginas (Dashboard, Projetos).
- TanStack Query para data fetching (já no projeto).
- Loading state e error state em todos os endpoints chamados.
- Não adicionar bibliotecas além do que já está instalado, salvo decisão consciente.

### Ciclo

1. Veio escreve prompt detalhado para Claude Code (com partes 1, 2, 3, 4 e regras explícitas).
2. Claude Code executa em sequência, mostrando logs.
3. Se houver erro estrutural (migration de enum, conflito de schema), Claude Code **pede aprovação humana** antes de aplicar.
4. Veio valida visualmente no navegador.
5. Se aprovado, commit e push.
6. Se rejeitado, descreve o problema (Claude do chat não consegue ver a tela).

### Riscos identificados

- Duplicação silenciosa entre 2 sessões Claude Code rodando em paralelo.
- Divergência de estilo sem formatação enforced.
- Decisões arquiteturais mudadas sem ADR.

### Mitigações

- CLAUDE.md na raiz com regras do projeto.
- Architecture Decision Records em `/docs/adr`.
- Pre-commit hooks com linting/formatting.
- Daily sync de 15min (mental) para alinhar.
