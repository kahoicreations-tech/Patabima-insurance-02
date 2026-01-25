"""Daraja (M-PESA) sandbox smoke test.

Runs outside Django server (direct API calls):
- OAuth token fetch
- Optional STK Push request
- Optional STK Query

Usage (PowerShell):
  $env:DJANGO_SETTINGS_MODULE='insurance.settings'
  C:/Users/USER/Desktop/PATABIMA01/.venv/Scripts/python.exe scripts/test_daraja_stk.py --token

  # STK Push (requires reachable callback URL if you want to receive callback):
  C:/Users/USER/Desktop/PATABIMA01/.venv/Scripts/python.exe scripts/test_daraja_stk.py --stk --phone 07XXXXXXXX --amount 1

  # Query:
  C:/Users/USER/Desktop/PATABIMA01/.venv/Scripts/python.exe scripts/test_daraja_stk.py --query --checkout-request-id ws_CO_...
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys

from dotenv import load_dotenv


def _redact_url(url: str) -> str:
    if not url:
        return ""
    # Keep scheme + host, hide path/query
    try:
        from urllib.parse import urlparse

        p = urlparse(url)
        if not p.scheme or not p.netloc:
            return "***"
        return f"{p.scheme}://{p.netloc}/***"
    except Exception:
        return "***"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--token", action="store_true", help="Fetch OAuth token")
    parser.add_argument("--stk", action="store_true", help="Send STK Push")
    parser.add_argument("--query", action="store_true", help="Query STK status")
    parser.add_argument("--phone", default=None)
    parser.add_argument("--amount", type=float, default=1.0)
    parser.add_argument("--account-reference", default="PB-SMOKE")
    parser.add_argument("--desc", default="PataBima Daraja Smoke Test")
    parser.add_argument("--checkout-request-id", default=None)

    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    backend_root = repo_root / "insurance-app"

    # Make `app.*` importable when running from repo root
    if str(backend_root) not in sys.path:
        sys.path.insert(0, str(backend_root))

    # Load backend env file (insurance-app/.env)
    env_path = backend_root / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)

    from app.services.mpesa_daraja import DarajaClient

    client = DarajaClient.from_env()

    print("[Daraja] env:", client.config.env)
    print("[Daraja] base_url:", client.config.base_url)
    print("[Daraja] shortcode:", str(client.config.shortcode)[:2] + "***")
    print("[Daraja] callback_url:", _redact_url(client.config.callback_url))

    if args.token:
        token = client._get_token()  # noqa: SLF001 (intentional for smoke test)
        print("[Daraja] token ok:", token[:8] + "***")

    if args.stk:
        if not args.phone:
            raise SystemExit("--phone is required for --stk")
        res = client.stk_push(
            phone=args.phone,
            amount=args.amount,
            account_reference=args.account_reference,
            transaction_desc=args.desc,
        )
        print("[Daraja] stk_push response:")
        print(res)

    if args.query:
        if not args.checkout_request_id:
            raise SystemExit("--checkout-request-id is required for --query")
        res = client.stk_query(checkout_request_id=args.checkout_request_id)
        print("[Daraja] stk_query response:")
        print(res)

    if not (args.token or args.stk or args.query):
        print("No action specified. Try --token or --stk.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
