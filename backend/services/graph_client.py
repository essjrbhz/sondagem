import os
import time
from typing import Optional

import httpx


GRAPH_BASE = "https://graph.microsoft.com"
_REQUIRED_ENV = (
    "GRAPH_TENANT_ID",
    "GRAPH_CLIENT_ID",
    "GRAPH_CLIENT_SECRET",
    "GRAPH_SHAREPOINT_HOST",
    "GRAPH_SHAREPOINT_SITE_PATH",
)


class GraphClientError(Exception):
    pass


class GraphClient:
    def __init__(self) -> None:
        missing = [k for k in _REQUIRED_ENV if not os.environ.get(k)]
        if missing:
            raise GraphClientError(
                f"Variáveis de ambiente ausentes: {', '.join(missing)}"
            )

        self._tenant_id   = os.environ["GRAPH_TENANT_ID"]
        self._client_id   = os.environ["GRAPH_CLIENT_ID"]
        self._client_secret = os.environ["GRAPH_CLIENT_SECRET"]
        self.sharepoint_host = os.environ["GRAPH_SHAREPOINT_HOST"]
        self.sharepoint_site_path = os.environ["GRAPH_SHAREPOINT_SITE_PATH"]

        self._token: Optional[str] = None
        self._token_expires_at: float = 0.0

        self._http = httpx.Client(timeout=30)

    # ── Auth ────────────────────────────────────────────────────────────────

    def _get_token(self) -> str:
        if self._token and time.time() < self._token_expires_at:
            return self._token

        url = (
            f"https://login.microsoftonline.com/{self._tenant_id}"
            "/oauth2/v2.0/token"
        )
        resp = self._http.post(
            url,
            data={
                "grant_type":    "client_credentials",
                "client_id":     self._client_id,
                "client_secret": self._client_secret,
                "scope":         "https://graph.microsoft.com/.default",
            },
        )
        if resp.status_code != 200:
            raise GraphClientError(
                f"Falha ao obter token OAuth: {resp.status_code} — {resp.text}"
            )

        payload = resp.json()
        self._token = payload["access_token"]
        # expires_in em segundos; margem de 5 min
        self._token_expires_at = time.time() + payload.get("expires_in", 3600) - 300
        return self._token

    # ── HTTP ────────────────────────────────────────────────────────────────

    def _request(self, method: str, url: str, **kwargs) -> dict:
        token = self._get_token()
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {token}"

        resp = self._http.request(method, url, headers=headers, **kwargs)

        if resp.status_code == 401:
            # token inválido — forçar refresh e tentar uma vez
            self._token = None
            token = self._get_token()
            headers["Authorization"] = f"Bearer {token}"
            resp = self._http.request(method, url, headers=headers, **kwargs)

        if resp.status_code == 429:
            retry_after = int(resp.headers.get("Retry-After", "10"))
            raise GraphClientError(
                f"Rate limit atingido (429). Tente novamente em {retry_after}s."
            )

        if not resp.is_success:
            raise GraphClientError(
                f"Graph API erro {resp.status_code} em {method} {url}: {resp.text}"
            )

        return resp.json() if resp.content else {}

    # ── Endpoints ───────────────────────────────────────────────────────────

    def get_site(self) -> dict:
        url = (
            f"{GRAPH_BASE}/v1.0/sites"
            f"/{self.sharepoint_host}:{self.sharepoint_site_path}"
        )
        return self._request("GET", url)

    def list_lists(self, site_id: str) -> list:
        url = f"{GRAPH_BASE}/v1.0/sites/{site_id}/lists"
        return self._request("GET", url).get("value", [])

    def get_list_columns(self, site_id: str, list_id: str) -> list:
        url = f"{GRAPH_BASE}/v1.0/sites/{site_id}/lists/{list_id}/columns"
        return self._request("GET", url).get("value", [])

    def get_list_items(
        self,
        site_id: str,
        list_id: str,
        top: int = 50,
        skip_token: Optional[str] = None,
    ) -> dict:
        url = f"{GRAPH_BASE}/v1.0/sites/{site_id}/lists/{list_id}/items"
        params: dict = {"$top": top, "$expand": "fields"}
        if skip_token:
            params["$skiptoken"] = skip_token

        data = self._request("GET", url, params=params)
        return {
            "items":     data.get("value", []),
            "next_link": data.get("@odata.nextLink"),
        }

    def get_item(self, site_id: str, list_id: str, item_id: str) -> dict:
        url = (
            f"{GRAPH_BASE}/v1.0/sites/{site_id}"
            f"/lists/{list_id}/items/{item_id}"
            "?$expand=fields"
        )
        return self._request("GET", url)

    def __del__(self):
        try:
            self._http.close()
        except Exception:
            pass
