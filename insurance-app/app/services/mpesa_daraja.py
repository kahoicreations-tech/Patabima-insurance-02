import base64
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple

import requests

logger = logging.getLogger(__name__)


def _env(name: str, default: Optional[str] = None) -> Optional[str]:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return value


def normalize_msisdn(phone: str) -> str:
    """Normalize Kenyan MSISDN to 2547XXXXXXXX format."""
    if not phone:
        raise ValueError("phone is required")

    raw = str(phone).strip().replace(" ", "")

    if raw.startswith("+"):
        raw = raw[1:]

    if raw.startswith("0") and len(raw) == 10:
        raw = "254" + raw[1:]

    if raw.startswith("7") and len(raw) == 9:
        raw = "254" + raw

    if not (raw.startswith("254") and len(raw) == 12 and raw[3] in {"7", "1"}):
        raise ValueError("Invalid phone number format. Expected 07XXXXXXXX, 2547XXXXXXXX, or +2547XXXXXXXX")

    return raw


@dataclass(frozen=True)
class DarajaConfig:
    env: str
    consumer_key: str
    consumer_secret: str
    shortcode: str
    passkey: str
    callback_url: str

    @property
    def base_url(self) -> str:
        if self.env.lower() == "production":
            return "https://api.safaricom.co.ke"
        return "https://sandbox.safaricom.co.ke"


class DarajaClient:
    """Minimal Daraja client for STK Push + STK Query."""

    def __init__(self, config: DarajaConfig):
        self.config = config
        self._token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None

    @staticmethod
    def from_env() -> "DarajaClient":
        env = (_env("MPESA_ENV", "sandbox") or "sandbox").lower()

        consumer_key = _env("MPESA_CONSUMER_KEY")
        consumer_secret = _env("MPESA_CONSUMER_SECRET")
        shortcode = _env("MPESA_SHORTCODE")
        passkey = _env("MPESA_PASSKEY")
        callback_url = _env("MPESA_CALLBACK_URL")

        missing = [
            name
            for name, val in [
                ("MPESA_CONSUMER_KEY", consumer_key),
                ("MPESA_CONSUMER_SECRET", consumer_secret),
                ("MPESA_SHORTCODE", shortcode),
                ("MPESA_PASSKEY", passkey),
                ("MPESA_CALLBACK_URL", callback_url),
            ]
            if not val
        ]
        if missing:
            raise RuntimeError(f"Missing required M-PESA env vars: {', '.join(missing)}")

        return DarajaClient(
            DarajaConfig(
                env=env,
                consumer_key=consumer_key,  # type: ignore[arg-type]
                consumer_secret=consumer_secret,  # type: ignore[arg-type]
                shortcode=shortcode,  # type: ignore[arg-type]
                passkey=passkey,  # type: ignore[arg-type]
                callback_url=callback_url,  # type: ignore[arg-type]
            )
        )

    def _get_token(self) -> str:
        if self._token and self._token_expires_at and datetime.utcnow() < self._token_expires_at:
            return self._token

        url = f"{self.config.base_url}/oauth/v1/generate?grant_type=client_credentials"
        resp = requests.get(url, auth=(self.config.consumer_key, self.config.consumer_secret), timeout=20)
        resp.raise_for_status()
        data = resp.json()

        token = data.get("access_token")
        expires_in = int(data.get("expires_in", 3599))

        if not token:
            raise RuntimeError("Failed to obtain Daraja access_token")

        self._token = token
        # Subtract a small safety margin
        self._token_expires_at = datetime.utcnow() + timedelta(seconds=max(expires_in - 30, 30))
        return token

    def _stk_password(self, timestamp: str) -> str:
        raw = f"{self.config.shortcode}{self.config.passkey}{timestamp}".encode("utf-8")
        return base64.b64encode(raw).decode("utf-8")

    def stk_push(
        self,
        *,
        phone: str,
        amount: float,
        account_reference: str,
        transaction_desc: str,
    ) -> Dict[str, Any]:
        token = self._get_token()
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        password = self._stk_password(timestamp)

        url = f"{self.config.base_url}/mpesa/stkpush/v1/processrequest"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "BusinessShortCode": self.config.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(round(float(amount))),
            "PartyA": normalize_msisdn(phone),
            "PartyB": self.config.shortcode,
            "PhoneNumber": normalize_msisdn(phone),
            "CallBackURL": self.config.callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc,
        }

        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        if resp.status_code >= 400:
            raise RuntimeError(f"Daraja STK push failed ({resp.status_code}): {resp.text}")
        return resp.json()

    def stk_query(self, *, checkout_request_id: str) -> Dict[str, Any]:
        token = self._get_token()
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        password = self._stk_password(timestamp)

        url = f"{self.config.base_url}/mpesa/stkpushquery/v1/query"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "BusinessShortCode": self.config.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id,
        }

        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        if resp.status_code >= 400:
            raise RuntimeError(f"Daraja STK query failed ({resp.status_code}): {resp.text}")
        return resp.json()


def parse_stk_callback(payload: Dict[str, Any]) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]]]:
    """Parse Daraja STK callback body.

    Returns (callback_info, metadata) where metadata may be None on failure/cancel.
    """
    body = payload.get("Body") or {}
    stk = body.get("stkCallback") or {}

    callback_info = {
        "MerchantRequestID": stk.get("MerchantRequestID"),
        "CheckoutRequestID": stk.get("CheckoutRequestID"),
        "ResultCode": stk.get("ResultCode"),
        "ResultDesc": stk.get("ResultDesc"),
    }

    meta = stk.get("CallbackMetadata") or {}
    items = meta.get("Item") or []
    if not isinstance(items, list):
        items = []

    parsed: Dict[str, Any] = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        name = item.get("Name")
        if not name:
            continue
        if "Value" in item:
            parsed[name] = item.get("Value")

    # On failed/cancelled requests, CallbackMetadata may be absent
    return callback_info, (parsed if parsed else None)
