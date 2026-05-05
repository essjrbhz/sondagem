"""
Script de migração: lê as abas BD_* do Excel e popula o PostgreSQL.

Uso:
    docker compose exec backend python seed_from_excel.py
    python seed_from_excel.py  (fora do container, com DATABASE_URL configurada)
"""

import sys
from datetime import datetime, date
from pathlib import Path

import openpyxl
from sqlalchemy.exc import IntegrityError

# Caminho do Excel — montado como volume no container
EXCEL_PATH = Path("/app/docs/Acompanhamento de Sondagem_Rev00 - Vale Sul 4522.xlsx")

# ── Bootstrap ──────────────────────────────────────────────────────────────

from database import SessionLocal, engine
import models
from auth import hash_senha

models.Base.metadata.create_all(bind=engine)


# ── Helpers ────────────────────────────────────────────────────────────────

def parse_date(val) -> date | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        s = val.strip()
        if not s or s == "-":
            return None
        for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
            try:
                return datetime.strptime(s, fmt).date()
            except ValueError:
                continue
    return None


def to_decimal(val):
    if val is None or (isinstance(val, str) and val.strip() in ("", "-")):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def rows(ws) -> list[tuple]:
    data = list(ws.iter_rows(values_only=True))
    return data[1:]  # pula header


# ── Seed ───────────────────────────────────────────────────────────────────

def seed():
    if not EXCEL_PATH.exists():
        print(f"[ERRO] Arquivo não encontrado: {EXCEL_PATH}")
        sys.exit(1)

    wb = openpyxl.load_workbook(str(EXCEL_PATH))
    db = SessionLocal()

    try:
        print("── Clientes ──────────────────────────────")
        for row in rows(wb["BD_CLIENTES"]):
            if not any(row):
                continue
            id_, nome, cnpj, *_ = row
            if db.query(models.Cliente).filter(models.Cliente.id == id_).first():
                print(f"  skip  Cliente id={id_} (já existe)")
                continue
            db.add(models.Cliente(id=id_, nome=nome, cnpj=cnpj))
            print(f"  +  Cliente id={id_}  {nome}")
        db.commit()

        print("── Sondas ────────────────────────────────")
        for row in rows(wb["BD_SONDAS"]):
            if not any(row):
                continue
            id_, nome, ativa, *_ = row
            if db.query(models.Sonda).filter(models.Sonda.id == id_).first():
                print(f"  skip  Sonda id={id_} (já existe)")
                continue
            db.add(models.Sonda(id=id_, nome=nome, ativa=bool(ativa)))
            print(f"  +  Sonda id={id_}  {nome}")
        db.commit()

        print("── Projetos ──────────────────────────────")
        for row in rows(wb["BD_PROJETOS"]):
            if not any(row):
                continue
            id_, codigo, nome, cliente_id, sonda_id, cidade, uf, *_ = row
            if db.query(models.Projeto).filter(models.Projeto.id == id_).first():
                print(f"  skip  Projeto id={id_} (já existe)")
                continue
            db.add(models.Projeto(
                id=id_, codigo=codigo, nome=nome,
                cliente_id=cliente_id, sonda_id=sonda_id,
                cidade=cidade, uf=uf,
            ))
            print(f"  +  Projeto id={id_}  {codigo}")
        db.commit()

        print("── Furos ─────────────────────────────────")
        furos_inseridos = 0
        for row in rows(wb["BD_FUROS"]):
            if not any(row):
                continue
            (id_, projeto_id, id_furo, tipo_furo,
             coord_e, coord_n, prof_prev, prof_real,
             data_ini, data_ter, status, *_) = row

            if db.query(models.Furo).filter(models.Furo.id == id_).first():
                continue

            d_ini = parse_date(data_ini)
            d_ter = parse_date(data_ter)

            # Datas inconsistentes no Excel (ambiguidade DD/MM vs MM/DD):
            # se data_termino < data_inicio, descarta data_termino.
            if d_ini and d_ter and d_ter < d_ini:
                print(f"  aviso  Furo id={id_}: data_termino ({d_ter}) < data_inicio ({d_ini}) — data_termino ignorada")
                d_ter = None

            db.add(models.Furo(
                id=id_,
                projeto_id=projeto_id,
                id_furo=str(id_furo) if id_furo else "",
                tipo_furo=str(tipo_furo) if tipo_furo else None,
                coordenada_e=to_decimal(coord_e),
                coordenada_n=to_decimal(coord_n),
                prof_prevista_m=to_decimal(prof_prev),
                prof_realizada_m=to_decimal(prof_real),
                data_inicio=d_ini,
                data_termino=d_ter,
                status=status if status else "Pendente",
            ))
            furos_inseridos += 1
        db.commit()
        print(f"  +  {furos_inseridos} furos inseridos")

        print("── Atividades ────────────────────────────")
        ativ_inseridas = 0
        for row in rows(wb["BD_ATIVIDADES_FURO"]):
            if not any(row):
                continue
            id_, furo_id, categoria, tipo, prof_ini, prof_fim, *_ = row

            if db.query(models.AtividadeFuro).filter(models.AtividadeFuro.id == id_).first():
                continue

            db.add(models.AtividadeFuro(
                id=id_,
                furo_id=furo_id,
                categoria=categoria,
                tipo=str(tipo) if tipo else None,
                prof_inicio_m=to_decimal(prof_ini),
                prof_fim_m=to_decimal(prof_fim),
            ))
            ativ_inseridas += 1
        db.commit()
        print(f"  +  {ativ_inseridas} atividades inseridas")

        print("── Usuário admin padrão ──────────────────")
        if not db.query(models.Usuario).filter(models.Usuario.email == "admin@sondagem.com").first():
            db.add(models.Usuario(
                nome="Administrador",
                email="admin@sondagem.com",
                senha_hash=hash_senha("admin123"),
                role="admin",
            ))
            db.commit()
            print("  +  admin@sondagem.com  /  admin123")
        else:
            print("  skip  admin já existe")

        print()
        print("✓ Seed concluído com sucesso.")

    except Exception as exc:
        db.rollback()
        print(f"[ERRO] {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
