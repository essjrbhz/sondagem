import re
import time
import logging
import httpx

logger = logging.getLogger(__name__)


class GeocodingService:
    """
    Resolve coordenadas de cidades brasileiras via Nominatim (OSM).
    Rate limit: 1 req/segundo (política da Nominatim).
    """

    BASE_URL = "https://nominatim.openstreetmap.org/search"
    USER_AGENT = "GeothraGestao/1.0 (gestao@geothra.com.br)"
    MIN_INTERVAL_SECONDS = 1.1

    def __init__(self) -> None:
        self._last_request = 0.0

    def _throttle(self) -> None:
        now = time.time()
        elapsed = now - self._last_request
        if elapsed < self.MIN_INTERVAL_SECONDS:
            time.sleep(self.MIN_INTERVAL_SECONDS - elapsed)
        self._last_request = time.time()

    def geocode(self, query: str) -> dict | None:
        """Retorna {lat, lng, display_name} ou None. Nunca levanta exceção."""
        if not query or not query.strip():
            return None
        self._throttle()
        try:
            r = httpx.get(
                self.BASE_URL,
                params={"q": query, "format": "json", "limit": 1, "countrycodes": "br"},
                headers={"User-Agent": self.USER_AGENT},
                timeout=10.0,
            )
            r.raise_for_status()
            data = r.json()
            if not data:
                return None
            item = data[0]
            return {
                "lat": float(item["lat"]),
                "lng": float(item["lon"]),
                "display_name": item.get("display_name", ""),
            }
        except Exception as exc:
            logger.warning("Geocoding falhou para '%s': %s", query, exc)
            return None

    @staticmethod
    def simplify_query(local_execucao: str) -> str:
        """
        Extrai primeira cidade do texto livre do RDO.
        Ex: 'Itatiaiuçu, Mateus Leme, Rio Manso...' → 'Itatiaiuçu, Brasil'
        Ex: 'Itatiaiuçu/MG' → 'Itatiaiuçu, Brasil'
        """
        if not local_execucao:
            return ""
        text = local_execucao.strip()
        first = re.split(r"[,;/\\-]", text, maxsplit=1)[0].strip()
        if not first:
            return ""
        return f"{first}, Brasil"
