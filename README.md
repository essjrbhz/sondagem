<div align="center">

<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="64" height="30" rx="6" fill="#E6D352"/>
  <rect x="4" y="38" width="64" height="30" rx="6" fill="#B29312"/>
  <text x="36" y="60" font-family="Arial Black, sans-serif" font-size="28" font-weight="900" fill="white" text-anchor="middle">GR</text>
</svg>

# Sistema de Acompanhamento de Sondagens

**Geothra Geologia & Geotecnia**

![FastAPI](https://img.shields.io/badge/FastAPI-0.115-003440?style=flat-square&logo=fastapi&logoColor=E6D352)
![React](https://img.shields.io/badge/React-19-003440?style=flat-square&logo=react&logoColor=E6D352)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-003440?style=flat-square&logo=postgresql&logoColor=E6D352)
![Docker](https://img.shields.io/badge/Docker-Compose-003440?style=flat-square&logo=docker&logoColor=E6D352)
![TypeScript](https://img.shields.io/badge/TypeScript-5-003440?style=flat-square&logo=typescript&logoColor=E6D352)

</div>

---

Sistema web de monitoramento de sondagens geotécnicas em tempo real. Acompanhamento de furos, avanço por projeto, produtividade por sonda e geração de relatórios em PDF — tudo em uma interface com identidade visual da Geothra.

## Telas

| Tela | Descrição |
|---|---|
| **Login** | Autenticação com layout split-screen 50/50 identidade Geothra |
| **Dashboard** | KPIs gerais, gráfico de avanço temporal, distribuição de status e produtividade por sonda |
| **Projetos** | Listagem com filtros; clique no projeto filtra os furos correspondentes |
| **Furos** | Listagem completa com modais para mudança de status e atualização de progresso |
| **Relatórios** | Visão consolidada por projeto com suporte a impressão/PDF |

## Stack

### Backend
- **FastAPI** — API REST com validação Pydantic
- **SQLAlchemy 2.0** + **Alembic** — ORM e migrações
- **PostgreSQL 16** — banco de dados relacional
- **JWT** (python-jose + passlib/bcrypt) — autenticação stateless

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v3** — estilização utilitária
- **Recharts** — gráficos de avanço e produtividade
- **React Router v6** — navegação SPA

### Infra
- **Docker Compose** — orquestração de containers
- **Nginx** — serve o frontend e faz proxy reverso para `/api/`

## Como rodar

### Pré-requisitos
- Docker e Docker Compose instalados

### Subir o sistema

```bash
git clone https://github.com/essjrbhz/sondagem.git
cd sondagem
docker compose up -d
```

Acesse em **http://localhost**

> Na rede local: `http://<IP-DO-SERVIDOR>`

### Credenciais padrão

| Campo | Valor |
|---|---|
| E-mail | `admin@sondagem.com` |
| Senha | `admin123` |

> Altere a senha após o primeiro acesso.

## Estrutura de diretórios

```
sondagem/
├── backend/
│   ├── alembic/          # migrações do banco
│   ├── routers/          # endpoints: projetos, furos, dashboard…
│   ├── models.py         # modelos SQLAlchemy
│   ├── schemas.py        # schemas Pydantic
│   ├── main.py           # aplicação FastAPI
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/        # Dashboard, Projetos, Furos, Relatórios, Login
│   │   ├── components/   # Layout, Sidebar, Header, ProtectedRoute
│   │   ├── context/      # AuthContext (JWT)
│   │   └── api/          # cliente Axios
│   └── Dockerfile
├── docker-compose.yml
└── .gitignore
```

## Roles de acesso

| Role | Permissões |
|---|---|
| **admin** | Acesso total |
| **gerente** | Todas as transições de status (incluindo cancelar e reabrir) |
| **técnico** | Pendente → Em Execução e Em Execução → Concluído |

## Design system

| Token | Cor | Uso |
|---|---|---|
| `primary` | `#003440` | Sidebar, botões, ícones ativos |
| `accent` | `#E6D352` | Item ativo na sidebar, badges, destaques |
| `gold` | `#B29312` | Ícones secundários, logo |

Status dos furos: **Pendente** `#E6D352` · **Em Execução** `#2563EB` · **Concluído** `#16A34A` · **Cancelado** `#6B7280`

---

<div align="center">
  <sub>Desenvolvido por <strong>Geothra Geologia & Geotecnia</strong></sub>
</div>
