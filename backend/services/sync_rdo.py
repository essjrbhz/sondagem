import logging
from urllib.parse import urlparse, parse_qs
from sqlalchemy.orm import Session

from services.graph_client import GraphClient
import models

logger = logging.getLogger(__name__)

# Usuários RDO não podem fazer login.
# String que nunca valida como bcrypt (bcrypt começa com $2b$ ou $2a$).
_PLACEHOLDER_HASH = "!RDO_PLACEHOLDER_NO_LOGIN"

# Emails protegidos — nunca sobrescrever
_PROTECTED_EMAILS = {"admin@sondagem.com"}

_LISTS_NEEDED = {
    "GD_ProjetoGrupo", "GD_Projeto", "GD_FrenteServico",
    "GD_FrenteServicoFuro", "GD_Equipamento", "GD_Equipe",
    "GD_EquipeCargo", "GD_EquipamentoTipo", "GD_RDO", "GD_RDOFuro",
}

_TIPO_EQUIP_MAP: dict[str, str] = {
    "sonda":                        "sonda",
    "percussão":                    "percussao",
    "percussao":                    "percussao",
    "trado mecânico":               "trado_mecanico",
    "trado mecanico":               "trado_mecanico",
    "trado manual":                 "trado_manual",
    "cptu":                         "cptu",
    "mach 700":                     "mach700",
    "mach700":                      "mach700",
    "tripé":                        "tripe",
    "tripe":                        "tripe",
    "trado":                        "trado",
    "radar de penetração do solo":  "radar_penetracao",
    "radar de penetracao do solo":  "radar_penetracao",
    "resistividade elétrica":       "resistividade",
    "resistividade eletrica":       "resistividade",
}

_STATUS_EQUIP_MAP: dict[str, str] = {
    "operante":   "operante",
    "inoperante": "inoperante",
    "manutenção": "manutencao",
    "manutencao": "manutencao",
    "reserva":    "reserva",
    "venda":      "venda",
}

_STATUS_PROJETO_MAP: dict[str, str] = {
    "em execução":  "em_execucao",
    "em execucao":  "em_execucao",
    "concluído":    "concluido",
    "concluido":    "concluido",
    "mobilização":  "mobilizacao",
    "mobilizacao":  "mobilizacao",
    "aguardando":   "aguardando",
}

_STATUS_CAMPANHA_MAP: dict[str, str] = {
    "em execução":  "em_execucao",
    "em execucao":  "em_execucao",
    "concluída":    "concluido",
    "concluida":    "concluido",
    "concluído":    "concluido",
    "concluido":    "concluido",
    "mobilização":  "mobilizacao",
    "mobilizacao":  "mobilizacao",
    "aguardando":   "aguardando",
}


# ── SyncReport ──────────────────────────────────────────────────────────────

class SyncReport:
    """Acumula contadores e erros do sync."""

    def __init__(self) -> None:
        self.created: dict[str, int] = {}
        self.updated: dict[str, int] = {}
        self.skipped: dict[str, int] = {}
        self.errors:  list[str]      = []

    def _inc(self, bucket: dict, key: str) -> None:
        bucket[key] = bucket.get(key, 0) + 1

    def add_created(self, entity: str) -> None:
        self._inc(self.created, entity)

    def add_updated(self, entity: str) -> None:
        self._inc(self.updated, entity)

    def add_skipped(self, entity: str) -> None:
        self._inc(self.skipped, entity)

    def add_error(self, msg: str) -> None:
        self.errors.append(msg)
        logger.error(msg)

    def to_dict(self) -> dict:
        return {
            "created": self.created,
            "updated": self.updated,
            "skipped": self.skipped,
            "errors":  self.errors,
        }

    def summary(self) -> str:
        lines = []
        for entity in set(list(self.created) + list(self.updated) + list(self.skipped)):
            lines.append(
                f"  {entity}: +{self.created.get(entity, 0)} "
                f"~{self.updated.get(entity, 0)} "
                f"skip={self.skipped.get(entity, 0)}"
            )
        if self.errors:
            lines.append(f"  ERROS: {len(self.errors)}")
        return "\n".join(lines) if lines else "  (nenhuma operação)"


# ── RDOSync ──────────────────────────────────────────────────────────────────

class RDOSync:
    def __init__(self, db: Session, graph: GraphClient) -> None:
        self.db          = db
        self.graph       = graph
        self.site_id: str | None      = None
        self.lists_cache: dict[str, str] = {}   # {displayName: list_id}
        self.report      = SyncReport()

    # ── infra ────────────────────────────────────────────────────────────────

    def setup(self) -> None:
        """Resolve site_id e cacheia IDs das listas necessárias."""
        site = self.graph.get_site()
        self.site_id = site["id"]
        logger.info("site_id: %s (%s)", self.site_id, site.get("displayName"))

        all_lists = self.graph.list_lists(self.site_id)
        for lst in all_lists:
            name = lst.get("displayName", "")
            if name in _LISTS_NEEDED:
                self.lists_cache[name] = lst["id"]

        found    = set(self.lists_cache.keys())
        missing  = _LISTS_NEEDED - found
        if missing:
            logger.warning("Listas não encontradas no site: %s", missing)
        logger.info(
            "setup OK — %d/%d listas cacheadas: %s",
            len(found), len(_LISTS_NEEDED), sorted(found),
        )

    def _fetch_all_items(self, list_name: str) -> list[dict]:
        """Pagina todos os itens de uma lista SharePoint."""
        list_id = self.lists_cache.get(list_name)
        if not list_id:
            logger.warning("Lista '%s' ausente no cache — pulando", list_name)
            return []

        items: list[dict] = []
        skip_token: str | None = None
        page = 0

        while True:
            page += 1
            result = self.graph.get_list_items(
                self.site_id, list_id, top=100, skip_token=skip_token
            )
            batch = result.get("items", [])
            items.extend(batch)
            logger.debug("%s — pág %d: %d itens", list_name, page, len(batch))

            next_link = result.get("next_link")
            if not next_link:
                break
            parsed    = urlparse(next_link)
            qs_params = parse_qs(parsed.query)
            skip_token = qs_params.get("$skiptoken", [None])[0]
            if not skip_token:
                break

        logger.info("%s — total: %d itens", list_name, len(items))
        return items

    # ── sync_clientes ────────────────────────────────────────────────────────

    def sync_clientes(self) -> None:
        """Sincroniza GD_ProjetoGrupo → tabela clientes."""
        items = self._fetch_all_items("GD_ProjetoGrupo")
        entity = "Cliente"

        for item in items:
            idce = item.get("id")
            fields = item.get("fields", {})
            nome = (fields.get("ProjetoGrupo") or fields.get("Title") or "").strip()

            # filtros de descarte
            nome_lower = nome.lower()
            if nome_lower.startswith("z_") or "zzz" in nome_lower:
                self.report.add_skipped(entity)
                continue
            if fields.get("Inativo") is True:
                self.report.add_skipped(entity)
                continue
            if not nome:
                self.report.add_skipped(entity)
                continue

            # logotipo_url: tenta campo Logotipo (pode ser URL string ou dict)
            logotipo_url: str | None = None
            raw_logo = fields.get("Logotipo") or fields.get("logotipo")
            if raw_logo:
                if isinstance(raw_logo, str):
                    logotipo_url = raw_logo
                elif isinstance(raw_logo, dict):
                    logotipo_url = raw_logo.get("Url") or raw_logo.get("url")

            try:
                existing = (
                    self.db.query(models.Cliente)
                    .filter(models.Cliente.idce_cliente == idce)
                    .first()
                )
                if existing:
                    existing.nome         = nome
                    existing.logotipo_url = logotipo_url
                    self.report.add_updated(entity)
                else:
                    self.db.add(models.Cliente(
                        nome=nome,
                        idce_cliente=idce,
                        logotipo_url=logotipo_url,
                    ))
                    self.report.add_created(entity)
            except Exception as exc:
                self.report.add_error(f"{entity} idce={idce}: {exc}")

        self.db.commit()
        logger.info("sync_clientes concluído: %s", self.report.to_dict().get("Cliente"))

    # ── sync_equipamentos ────────────────────────────────────────────────────

    def _load_tipos_equipamento(self) -> dict[int, str]:
        """Retorna {idce_tipo: nome_tipo} a partir de GD_EquipamentoTipo."""
        items = self._fetch_all_items("GD_EquipamentoTipo")
        tipos: dict[int, str] = {}
        for item in items:
            idce = item.get("id")
            nome = (item.get("fields", {}).get("EquipamentoTipo") or item.get("fields", {}).get("Title") or "").strip()
            if idce and nome:
                tipos[int(idce)] = nome
        return tipos

    def sync_equipamentos(self) -> None:
        """Sincroniza GD_Equipamento → tabela equipamentos."""
        tipos_map = self._load_tipos_equipamento()
        logger.info("GD_EquipamentoTipo carregado: %d tipos", len(tipos_map))

        items = self._fetch_all_items("GD_Equipamento")
        entity = "Equipamento"

        for item in items:
            idce   = item.get("id")
            fields = item.get("fields", {})
            nome   = (fields.get("Equipamento") or fields.get("Title") or "").strip()

            if not nome:
                self.report.add_skipped(entity)
                continue

            # derivar tipo via lookup GD_EquipamentoTipo
            tipo_db = "sonda"  # default
            idce_tipo = fields.get("IDCE_EquipamentoTipo") or fields.get("EquipamentoTipoId")
            if idce_tipo:
                nome_tipo = tipos_map.get(int(idce_tipo), "")
                tipo_db = _TIPO_EQUIP_MAP.get(nome_tipo.lower(), None)
                if tipo_db is None:
                    logger.warning(
                        "Equipamento idce=%s: tipo '%s' sem mapeamento — usando 'sonda'",
                        idce, nome_tipo,
                    )
                    tipo_db = "sonda"

            # derivar status
            status_raw = (fields.get("Status") or "operante").strip().lower()
            status_db  = _STATUS_EQUIP_MAP.get(status_raw, "operante")

            try:
                existing = (
                    self.db.query(models.Equipamento)
                    .filter(models.Equipamento.idce_equipamento == idce)
                    .first()
                )
                if existing:
                    existing.nome   = nome
                    existing.tipo   = tipo_db
                    existing.status = status_db
                    self.report.add_updated(entity)
                else:
                    self.db.add(models.Equipamento(
                        nome=nome,
                        tipo=tipo_db,
                        status=status_db,
                        idce_equipamento=idce,
                    ))
                    self.report.add_created(entity)
            except Exception as exc:
                self.report.add_error(f"{entity} idce={idce}: {exc}")

        self.db.commit()
        logger.info("sync_equipamentos concluído")

    # ── sync_pessoas ─────────────────────────────────────────────────────────

    def sync_pessoas(self) -> None:
        """Sincroniza GD_Equipe → tabela usuarios (não-loginável, só referência)."""
        items = self._fetch_all_items("GD_Equipe")
        entity = "Usuario"

        for item in items:
            idce   = item.get("id")
            fields = item.get("fields", {})
            nome   = (
                fields.get("Title")
                or fields.get("Nome")
                or fields.get("EquipeNome")
                or ""
            ).strip()

            if not nome:
                self.report.add_skipped(entity)
                continue

            email = f"rdo_{idce}@geothra.local"

            if email in _PROTECTED_EMAILS:
                self.report.add_skipped(entity)
                continue

            try:
                existing = (
                    self.db.query(models.Usuario)
                    .filter(models.Usuario.email == email)
                    .first()
                )
                if existing:
                    existing.nome = nome
                    self.report.add_updated(entity)
                else:
                    self.db.add(models.Usuario(
                        nome=nome,
                        email=email,
                        senha_hash=_PLACEHOLDER_HASH,
                        role="tecnico",
                        ativo=True,
                    ))
                    self.report.add_created(entity)
            except Exception as exc:
                self.report.add_error(f"{entity} idce={idce}: {exc}")

        self.db.commit()
        logger.info("sync_pessoas concluído")

    # ── sync_obras ───────────────────────────────────────────────────────────

    def sync_obras(self) -> None:
        """Sincroniza GD_Projeto → tabela projetos."""
        items = self._fetch_all_items("GD_Projeto")
        entity = "Projeto"

        for item in items:
            idce   = item.get("id")
            fields = item.get("fields", {})
            nome   = (fields.get("Projeto") or fields.get("Title") or "").strip()

            # filtros de descarte
            nome_lower = nome.lower()
            if nome_lower.startswith("z_") or "zzz" in nome_lower:
                self.report.add_skipped(entity)
                continue
            if fields.get("Inativo") is True:
                self.report.add_skipped(entity)
                continue
            if not nome:
                self.report.add_skipped(entity)
                continue

            # resolver cliente via IDCE_ProjetoGrupo
            idce_grupo = fields.get("IDCE_ProjetoGrupo")
            cliente = None
            if idce_grupo:
                cliente = (
                    self.db.query(models.Cliente)
                    .filter(models.Cliente.idce_cliente == int(idce_grupo))
                    .first()
                )
            if not cliente:
                self.report.add_error(
                    f"{entity} idce={idce}: cliente idce_grupo={idce_grupo} não encontrado — pulando"
                )
                continue

            # mapear status
            status_raw = (fields.get("ProjetoStatus") or "em execução").strip().lower()
            status_db  = _STATUS_PROJETO_MAP.get(status_raw, "em_execucao")
            if status_db not in _STATUS_PROJETO_MAP.values():
                logger.warning("%s idce=%s: status '%s' sem mapeamento — usando em_execucao", entity, idce, status_raw)
                status_db = "em_execucao"

            # datas ISO → date
            def parse_date(val):
                if not val:
                    return None
                try:
                    from datetime import date
                    return date.fromisoformat(val[:10])
                except Exception:
                    return None

            try:
                existing = (
                    self.db.query(models.Projeto)
                    .filter(models.Projeto.idce_projeto == int(idce))
                    .first()
                )
                if existing:
                    existing.nome            = nome
                    existing.cliente_id      = cliente.id
                    existing.local_execucao  = fields.get("LocalExecucao")
                    existing.centro_custo    = fields.get("CentroCusto")
                    existing.numero_contrato = fields.get("NumeroContrato")
                    existing.objeto_contrato = fields.get("ObjetoContrato")
                    existing.gestor_cliente  = fields.get("GestorCliente")
                    existing.gestor_geothra  = fields.get("GestorGeothra")
                    existing.data_inicio     = parse_date(fields.get("DataInicio"))
                    existing.data_termino    = parse_date(fields.get("DataTermino"))
                    existing.status_projeto  = status_db
                    self.report.add_updated(entity)
                else:
                    # codigo: usar CodigoFrenteServico se existir, senão gerar de idce
                    codigo = fields.get("CentroCusto") or f"RDO-{idce}"
                    # garante unicidade sem colisão
                    if self.db.query(models.Projeto).filter(models.Projeto.codigo == codigo).first():
                        codigo = f"RDO-{idce}"
                    self.db.add(models.Projeto(
                        codigo           = codigo,
                        nome             = nome,
                        cliente_id       = cliente.id,
                        local_execucao   = fields.get("LocalExecucao"),
                        centro_custo     = fields.get("CentroCusto"),
                        numero_contrato  = fields.get("NumeroContrato"),
                        objeto_contrato  = fields.get("ObjetoContrato"),
                        gestor_cliente   = fields.get("GestorCliente"),
                        gestor_geothra   = fields.get("GestorGeothra"),
                        data_inicio      = parse_date(fields.get("DataInicio")),
                        data_termino     = parse_date(fields.get("DataTermino")),
                        status_projeto   = status_db,
                        idce_projeto     = int(idce),
                    ))
                    self.report.add_created(entity)
            except Exception as exc:
                self.db.rollback()
                self.report.add_error(f"{entity} idce={idce}: {exc}")

        self.db.commit()
        logger.info("sync_obras concluído")

    # ── sync_campanhas ───────────────────────────────────────────────────────

    def sync_campanhas(self) -> None:
        """Sincroniza GD_FrenteServico → tabela campanhas."""
        items = self._fetch_all_items("GD_FrenteServico")
        entity = "Campanha"

        for item in items:
            idce   = item.get("id")
            fields = item.get("fields", {})

            codigo = (fields.get("CodigoFrenteServico") or "").strip()
            nome   = (fields.get("FrenteServico") or codigo or "").strip()

            # filtros de descarte
            nome_lower = nome.lower()
            if nome_lower.startswith("z_") or "zzz" in nome_lower:
                self.report.add_skipped(entity)
                continue
            if fields.get("Inativo") is True:
                self.report.add_skipped(entity)
                continue
            if not codigo:
                self.report.add_skipped(entity)
                continue

            # resolver obra via IDCE_Projeto
            idce_projeto = fields.get("IDCE_Projeto")
            obra = None
            if idce_projeto:
                obra = (
                    self.db.query(models.Projeto)
                    .filter(models.Projeto.idce_projeto == int(idce_projeto))
                    .first()
                )
            if not obra:
                self.report.add_error(
                    f"{entity} idce={idce}: obra idce_projeto={idce_projeto} não encontrada — pulando"
                )
                continue

            # mapear status
            status_raw = (fields.get("Status") or "em execução").strip().lower()
            status_db  = _STATUS_CAMPANHA_MAP.get(status_raw, "em_execucao")

            def parse_date(val):
                if not val:
                    return None
                try:
                    from datetime import date
                    return date.fromisoformat(val[:10])
                except Exception:
                    return None

            try:
                existing = (
                    self.db.query(models.Campanha)
                    .filter(models.Campanha.idce_frenteservico == int(idce))
                    .first()
                )
                if existing:
                    existing.codigo       = codigo
                    existing.descricao    = nome
                    existing.obra_id      = obra.id
                    existing.data_inicio  = parse_date(fields.get("DataInicio"))
                    existing.data_termino = parse_date(fields.get("DataTermino"))
                    existing.status       = status_db
                    self.report.add_updated(entity)
                else:
                    self.db.add(models.Campanha(
                        codigo                 = codigo,
                        descricao              = nome,
                        obra_id                = obra.id,
                        data_inicio            = parse_date(fields.get("DataInicio")),
                        data_termino           = parse_date(fields.get("DataTermino")),
                        status                 = status_db,
                        idce_frenteservico     = int(idce),
                    ))
                    self.report.add_created(entity)
            except Exception as exc:
                self.db.rollback()
                self.report.add_error(f"{entity} idce={idce}: {exc}")

        self.db.commit()
        logger.info("sync_campanhas concluído")

    # ── entry point ──────────────────────────────────────────────────────────

    def run_initial_sync(self) -> SyncReport:
        """Executa sync completo: clientes → equipamentos → pessoas → obras → campanhas."""
        self.setup()
        self.sync_clientes()
        self.sync_equipamentos()
        self.sync_pessoas()
        self.sync_obras()
        self.sync_campanhas()
        logger.info("Sync inicial concluído:\n%s", self.report.summary())
        return self.report
