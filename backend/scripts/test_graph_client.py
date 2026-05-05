import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.graph_client import GraphClient, GraphClientError


def main() -> int:
    try:
        client = GraphClient()
        print("GraphClient instanciado OK")

        print("\n[1] Obtendo site SharePoint...")
        site = client.get_site()
        site_id = site["id"]
        print(f"    site_id : {site_id}")
        print(f"    nome    : {site.get('displayName', '—')}")
        print(f"    URL     : {site.get('webUrl', '—')}")

        print("\n[2] Listando lists do site...")
        lists = client.list_lists(site_id)
        print(f"    Total de lists: {len(lists)}")
        print("    Primeiras 5:")
        for lst in lists[:5]:
            print(f"      - {lst.get('id')}  |  {lst.get('displayName', '—')}")

        print("\nSucesso.")
        return 0

    except GraphClientError as e:
        print(f"\nERRO GraphClient: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"\nERRO inesperado: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
