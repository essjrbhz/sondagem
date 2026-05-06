from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import usuarios, clientes, sondas, projetos, furos, atividades, dashboard, mapa

app = FastAPI(
    title="Sondagens Vale Sul — API",
    description="Sistema de Acompanhamento de Sondagens Geotécnicas",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restringir para o domínio do frontend em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios.router)
app.include_router(clientes.router)
app.include_router(sondas.router)
app.include_router(projetos.router)
app.include_router(furos.router)
app.include_router(atividades.router)
app.include_router(dashboard.router)
app.include_router(mapa.router)


@app.get("/health", tags=["Sistema"])
def health():
    return {"status": "ok"}
