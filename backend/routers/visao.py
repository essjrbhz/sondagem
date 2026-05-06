from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
from auth import requer_qualquer
from database import get_db

router = APIRouter(prefix="/visao", tags=["Visão"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class KPIs(BaseModel):
    campanhas_ativas: int
    rdos_total: int
    metros_executados_total: float
    obras_ativas: int


class AlertaItem(BaseModel):
    id: int
    label: str
    subtitulo: str | None


class Alerta(BaseModel):
    tipo: str
    severidade: str
    titulo: str
    detalhe: str | None
    count: int
    items: list[AlertaItem]


class AlertasResponse(BaseModel):
    alertas: list[Alerta]


class CampanhaAtiva(BaseModel):
    id: int
    codigo: str
    descricao: str | None
    cliente_nome: str
    obra_nome: str
    obra_codigo: str | None
    equipamento_nome: str | None
    furos_planejados: int
    furos_executados: int
    metros_planejados: float
    metros_executados: float
    ultimo_rdo_data: str | None
    ultimo_rdo_dias_atras: int | None
    data_inicio: str | None
    data_termino: str | None


class CampanhasAtivasResponse(BaseModel):
    campanhas: list[CampanhaAtiva]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _metros_rdofuros(rdofuros: list) -> float:
    return round(sum(
        float(rf.prof_final_dia or 0) - float(rf.prof_inicial_dia or 0)
        for rf in rdofuros
        if (rf.prof_final_dia or 0) > (rf.prof_inicial_dia or 0)
    ), 2)


def _sev_order(s: str) -> int:
    return {"alta": 0, "media": 1, "baixa": 2}.get(s, 3)


# ── GET /visao/kpis ────────────────────────────────────────────────────────────

@router.get("/kpis", response_model=KPIs)
def kpis(db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    campanhas_ativas = db.query(models.Campanha).filter(
        models.Campanha.status == "em_execucao"
    ).count()

    obras_ativas = (
        db.query(models.Campanha.obra_id)
        .filter(models.Campanha.status == "em_execucao", models.Campanha.obra_id.isnot(None))
        .distinct()
        .count()
    )

    rdos_total = db.query(models.RDO).filter(models.RDO.status_rdo == "aprovado").count()

    rdofuros = db.query(models.RDOFuro).join(
        models.RDO, models.RDOFuro.rdo_id == models.RDO.id
    ).filter(models.RDO.status_rdo == "aprovado").all()

    metros = _metros_rdofuros(rdofuros)

    return KPIs(
        campanhas_ativas=campanhas_ativas,
        rdos_total=rdos_total,
        metros_executados_total=metros,
        obras_ativas=obras_ativas,
    )


# ── GET /visao/alertas ─────────────────────────────────────────────────────────

@router.get("/alertas", response_model=AlertasResponse)
def alertas(db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    hoje = date.today()
    result: list[Alerta] = []

    camps_em_exec = db.query(models.Campanha).filter(
        models.Campanha.status == "em_execucao"
    ).all()
    camp_ids_exec = [c.id for c in camps_em_exec]

    # Último RDO aprovado por campanha (todos os RDOs são aprovados neste sistema)
    rdos = db.query(models.RDO).filter(models.RDO.campanha_id.in_(camp_ids_exec)).all()
    last_rdo_por_camp: dict[int, date] = {}
    for r in rdos:
        if r.campanha_id not in last_rdo_por_camp or r.data > last_rdo_por_camp[r.campanha_id]:
            last_rdo_por_camp[r.campanha_id] = r.data

    # ── a) campanha_sem_rdo (alta se > 7 dias) ────────────────────────────────
    afetadas_srdo = []
    for camp in camps_em_exec:
        last = last_rdo_por_camp.get(camp.id)
        dias = (hoje - last).days if last else 9999
        if dias > 7:
            afetadas_srdo.append((camp, dias))

    if afetadas_srdo:
        afetadas_srdo.sort(key=lambda x: x[1], reverse=True)
        obra_dict = {o.id: o for o in db.query(models.Projeto).all()}
        items = [
            AlertaItem(
                id=c.id,
                label=c.codigo,
                subtitulo=f"{dias} dias sem RDO"
                          + (f" · {obra_dict[c.obra_id].nome[:40]}" if c.obra_id and c.obra_id in obra_dict else ""),
            )
            for c, dias in afetadas_srdo[:5]
        ]
        n = len(afetadas_srdo)
        result.append(Alerta(
            tipo="campanha_sem_rdo",
            severidade="alta",
            titulo=f"{n} campanha{'s' if n != 1 else ''} sem RDO há mais de 7 dias",
            detalhe="Campanhas em execução que não registraram atividade recente",
            count=n,
            items=items,
        ))

    # ── b) contrato_vencendo (alta ≤ 30 dias, média ≤ 60 dias) ───────────────
    obras_com_termino = db.query(models.Projeto).filter(
        models.Projeto.data_termino.isnot(None)
    ).all()
    vencendo: list[tuple] = []
    for obra in obras_com_termino:
        dias_rest = (obra.data_termino - hoje).days
        if 0 <= dias_rest <= 60:
            vencendo.append((obra, dias_rest))

    if vencendo:
        vencendo.sort(key=lambda x: x[1])
        sev = "alta" if any(d <= 30 for _, d in vencendo) else "media"
        n = len(vencendo)
        items = [
            AlertaItem(
                id=obra.id,
                label=obra.nome[:50],
                subtitulo=f"{dias} dias restantes · {obra.cliente.nome[:30]}" if dias > 0 else "Vence hoje",
            )
            for obra, dias in vencendo[:5]
        ]
        result.append(Alerta(
            tipo="contrato_vencendo",
            severidade=sev,
            titulo=f"{n} obra{'s' if n != 1 else ''} com contrato encerrando em até 60 dias",
            detalhe="Obras próximas do fim do prazo contratual",
            count=n,
            items=items,
        ))

    # ── c) equipamento_ocioso (média se > 14 dias) ────────────────────────────
    equips = db.query(models.Equipamento).filter(
        models.Equipamento.status == "operante"
    ).all()

    # Mapa equipamento → campanhas ativas
    camp_por_equip: dict[int, list] = {}
    for c in camps_em_exec:
        if c.equipamento_id:
            camp_por_equip.setdefault(c.equipamento_id, []).append(c)

    ociosos = []
    for equip in equips:
        camps = camp_por_equip.get(equip.id, [])
        if not camps:
            continue
        datas = [last_rdo_por_camp[c.id] for c in camps if c.id in last_rdo_por_camp]
        if not datas:
            dias = 9999
        else:
            dias = (hoje - max(datas)).days
        if dias > 14:
            ociosos.append((equip, dias))

    if ociosos:
        ociosos.sort(key=lambda x: x[1], reverse=True)
        n = len(ociosos)
        items = [
            AlertaItem(
                id=equip.id,
                label=equip.nome,
                subtitulo=f"{dias} dias sem registro",
            )
            for equip, dias in ociosos[:5]
        ]
        result.append(Alerta(
            tipo="equipamento_ocioso",
            severidade="media",
            titulo=f"{n} equipamento{'s' if n != 1 else ''} sem atividade há mais de 14 dias",
            detalhe="Equipamentos operantes sem RDOs recentes nas campanhas ativas",
            count=n,
            items=items,
        ))

    # ── d) cliente_sem_atividade (alta se > 30 dias) ──────────────────────────
    clientes = db.query(models.Cliente).all()
    obras_all = db.query(models.Projeto).all()
    campanhas_all = db.query(models.Campanha).all()
    rdos_all = db.query(models.RDO).all()

    obras_por_cli: dict[int, list] = {}
    for o in obras_all:
        obras_por_cli.setdefault(o.cliente_id, []).append(o)

    camps_por_obra: dict[int, list] = {}
    for c in campanhas_all:
        if c.obra_id:
            camps_por_obra.setdefault(c.obra_id, []).append(c)

    last_rdo_all: dict[int, date] = {}
    for r in rdos_all:
        if r.campanha_id not in last_rdo_all or r.data > last_rdo_all[r.campanha_id]:
            last_rdo_all[r.campanha_id] = r.data

    inativos = []
    for cli in clientes:
        obras_cli = obras_por_cli.get(cli.id, [])
        if not obras_cli:
            continue
        camp_ids_cli = [c.id for o in obras_cli for c in camps_por_obra.get(o.id, [])]
        datas_cli = [last_rdo_all[cid] for cid in camp_ids_cli if cid in last_rdo_all]
        if not datas_cli:
            continue
        dias = (hoje - max(datas_cli)).days
        if dias > 30:
            inativos.append((cli, dias))

    if inativos:
        inativos.sort(key=lambda x: x[1], reverse=True)
        n = len(inativos)
        items = [
            AlertaItem(
                id=cli.id,
                label=cli.nome[:50],
                subtitulo=f"{dias} dias sem atividade",
            )
            for cli, dias in inativos[:5]
        ]
        result.append(Alerta(
            tipo="cliente_sem_atividade",
            severidade="alta",
            titulo=f"{n} cliente{'s' if n != 1 else ''} sem atividade há mais de 30 dias",
            detalhe="Clientes cujas campanhas não registraram RDOs recentes",
            count=n,
            items=items,
        ))

    result.sort(key=lambda a: (_sev_order(a.severidade), -a.count))
    return AlertasResponse(alertas=result)


# ── GET /visao/campanhas-ativas ────────────────────────────────────────────────

@router.get("/campanhas-ativas", response_model=CampanhasAtivasResponse)
def campanhas_ativas(db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    hoje = date.today()

    camps = db.query(models.Campanha).filter(
        models.Campanha.status == "em_execucao"
    ).all()

    camp_ids = [c.id for c in camps]

    # Furos planejados por campanha
    furos_all = db.query(models.Furo).filter(
        models.Furo.campanha_id.in_(camp_ids)
    ).all()
    furos_por_camp: dict[int, list] = {}
    for f in furos_all:
        if f.campanha_id:
            furos_por_camp.setdefault(f.campanha_id, []).append(f)

    # RDOs + RDOFuros por campanha
    rdos = db.query(models.RDO).filter(models.RDO.campanha_id.in_(camp_ids)).all()
    rdos_por_camp: dict[int, list] = {}
    for r in rdos:
        rdos_por_camp.setdefault(r.campanha_id, []).append(r)

    rdo_ids = [r.id for r in rdos]
    rdofuros = db.query(models.RDOFuro).filter(
        models.RDOFuro.rdo_id.in_(rdo_ids)
    ).all() if rdo_ids else []

    rdofuros_por_rdo: dict[int, list] = {}
    for rf in rdofuros:
        rdofuros_por_rdo.setdefault(rf.rdo_id, []).append(rf)

    # Obras e clientes
    obra_ids = list({c.obra_id for c in camps if c.obra_id})
    obras = {o.id: o for o in db.query(models.Projeto).filter(models.Projeto.id.in_(obra_ids)).all()}

    lista: list[CampanhaAtiva] = []
    for camp in camps:
        obra = obras.get(camp.obra_id) if camp.obra_id else None
        cliente_nome = obra.cliente.nome if obra else "—"
        obra_nome = obra.nome if obra else "—"
        obra_codigo = obra.codigo if obra else None

        equip_nome = camp.equipamento.nome if camp.equipamento else None

        furos_camp = furos_por_camp.get(camp.id, [])
        metros_plan = round(sum(float(f.prof_prevista_m or 0) for f in furos_camp), 2)
        furos_plan_count = len(furos_camp)

        rdos_camp = rdos_por_camp.get(camp.id, [])
        rds_camp_ids = [r.id for r in rdos_camp]
        rfs_camp = [rf for rId in rds_camp_ids for rf in rdofuros_por_rdo.get(rId, [])]

        metros_exec = _metros_rdofuros(rfs_camp)
        furos_exec = len({rf.furo_id for rf in rfs_camp})

        last_rdo_date: date | None = None
        for r in rdos_camp:
            if last_rdo_date is None or r.data > last_rdo_date:
                last_rdo_date = r.data

        dias_atras: int | None = None
        if last_rdo_date:
            dias_atras = (hoje - last_rdo_date).days

        lista.append(CampanhaAtiva(
            id=camp.id,
            codigo=camp.codigo,
            descricao=camp.descricao,
            cliente_nome=cliente_nome,
            obra_nome=obra_nome,
            obra_codigo=obra_codigo,
            equipamento_nome=equip_nome,
            furos_planejados=furos_plan_count,
            furos_executados=furos_exec,
            metros_planejados=metros_plan,
            metros_executados=metros_exec,
            ultimo_rdo_data=last_rdo_date.isoformat() if last_rdo_date else None,
            ultimo_rdo_dias_atras=dias_atras,
            data_inicio=camp.data_inicio.isoformat() if camp.data_inicio else None,
            data_termino=camp.data_termino.isoformat() if camp.data_termino else None,
        ))

    # Campanhas paradas primeiro (dias_atras desc), sem RDO por último
    lista.sort(key=lambda c: c.ultimo_rdo_dias_atras if c.ultimo_rdo_dias_atras is not None else 9999, reverse=True)
    return CampanhasAtivasResponse(campanhas=lista)
