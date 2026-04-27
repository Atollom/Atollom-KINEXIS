"""
Onboarding Service — crear tenant completo en una transacción atómica.
"""

import logging
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from ..utils.database import db
from ..utils.encryption import encryption

logger = logging.getLogger(__name__)

# Providers mapeados desde claves del wizard frontend → nombre canónico
_ECOMMERCE_PROVIDERS = {
    "ml":      ("mercadolibre", ["ml_access_token", "ml_refresh_token", "ml_user_id"]),
    "amazon":  ("amazon",       ["amazon_seller_id", "amazon_marketplace_id",
                                  "amazon_access_key", "amazon_secret_key"]),
    "shopify": ("shopify",      ["shopify_store_url", "shopify_access_token"]),
}
_MESSAGING_PROVIDERS = {
    "whatsapp":  ("whatsapp",  ["wa_phone_number_id", "wa_business_account_id", "wa_access_token"]),
    "instagram": ("instagram", ["ig_account_id", "ig_access_token"]),
    "facebook":  ("facebook",  ["fb_page_id", "fb_page_access_token"]),
}
_BILLING_PROVIDERS = {
    "facturama": ("facturama", ["facturama_username", "facturama_password", "facturama_sandbox"]),
    "facturapi": ("facturapi", ["facturapi_secret_key"]),
}

# Plan por límite de facturas (alineado con CFDIProvider)
_PLAN_THRESHOLDS = [(200, "starter"), (500, "growth"), (1000, "pro")]


class OnboardingService:
    """Procesa el onboarding wizard completo en una transacción atómica."""

    # ── Public ────────────────────────────────────────────────────────────────

    async def create_tenant(
        self,
        company: Dict[str, Any],
        ecommerce: Dict[str, Any],
        messaging: Dict[str, Any],
        billing: Dict[str, Any],
        users: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Crea tenant con toda su configuración en una transacción.

        Returns:
            {"success": True, "tenant_id": "...", "slug": "...",
             "plan": "...", "integrations_created": N, "users_created": N}
        """
        try:
            self._validate_company(company)
            self._validate_billing(billing)
            if not users:
                raise ValueError("At least one user is required")

            slug = await self._unique_slug(company["name"])
            plan = self._plan_for_limit(billing.get("invoice_limit", 200))

            async with db.transaction() as conn:
                tenant_id = await self._insert_tenant(conn, company, billing, slug, plan)
                await self._insert_fiscal_config(conn, tenant_id, billing)
                integrations = await self._insert_integrations(
                    conn, tenant_id, ecommerce, messaging, billing
                )
                users_created = await self._insert_users(conn, tenant_id, users)
                await conn.execute(
                    "UPDATE tenants SET onboarding_completed=TRUE, "
                    "onboarding_completed_at=NOW() WHERE id=$1",
                    tenant_id,
                )

            logger.info(f"Onboarding complete: tenant={tenant_id} slug={slug}")
            return {
                "success": True,
                "tenant_id": str(tenant_id),
                "slug": slug,
                "plan": plan,
                "integrations_created": integrations,
                "users_created": users_created,
            }

        except Exception as exc:
            logger.error(f"Onboarding failed: {exc}")
            return {"success": False, "error": str(exc)}

    async def get_tenant(self, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Fetches basic tenant info."""
        return await db.fetch_one(
            "SELECT id, name, slug, plan, status, onboarding_completed, created_at "
            "FROM tenants WHERE id=$1",
            uuid.UUID(tenant_id),
        )

    async def get_tenant_integrations(self, tenant_id: str) -> List[Dict[str, Any]]:
        """Lists integrations (without credentials)."""
        rows = await db.fetch_all(
            "SELECT id, provider, is_connected, last_test_at, created_at "
            "FROM tenant_integrations WHERE tenant_id=$1 AND is_enabled=TRUE",
            uuid.UUID(tenant_id),
        )
        return rows

    # ── Insert helpers ────────────────────────────────────────────────────────

    async def _insert_tenant(
        self,
        conn,
        company: Dict[str, Any],
        billing: Dict[str, Any],
        slug: str,
        plan: str,
    ) -> uuid.UUID:
        row = await conn.fetchrow(
            """
            INSERT INTO tenants (
                name, slug, rfc, legal_name,
                email, phone, address, logo_url,
                plan, status, trial_ends_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING id
            """,
            company["name"],
            slug,
            billing.get("rfc_emisor") or billing.get("rfc"),
            billing.get("razon_social") or company["name"],
            company.get("email"),
            company.get("phone"),
            company.get("address"),
            company.get("logo_url"),
            plan,
            "trial",
            datetime.now(timezone.utc) + timedelta(days=30),
        )
        tenant_id: uuid.UUID = row["id"]
        logger.info(f"Tenant inserted: {tenant_id}")
        return tenant_id

    async def _insert_fiscal_config(
        self, conn, tenant_id: uuid.UUID, billing: Dict[str, Any]
    ) -> None:
        rfc = billing.get("rfc_emisor") or billing.get("rfc", "")
        razon = billing.get("razon_social", "")
        regimen = billing.get("regimen_fiscal", "601")
        cp = billing.get("lugar_expedicion", "00000")
        limit = int(billing.get("invoice_limit", 200))

        await conn.execute(
            """
            INSERT INTO tenant_fiscal_config (
                tenant_id, rfc, razon_social, regimen_fiscal,
                codigo_postal, invoice_limit_monthly
            ) VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (tenant_id) DO UPDATE SET
                rfc=EXCLUDED.rfc,
                razon_social=EXCLUDED.razon_social,
                regimen_fiscal=EXCLUDED.regimen_fiscal,
                codigo_postal=EXCLUDED.codigo_postal,
                invoice_limit_monthly=EXCLUDED.invoice_limit_monthly,
                updated_at=NOW()
            """,
            tenant_id, rfc, razon, regimen, cp, limit,
        )
        logger.info(f"Fiscal config inserted for tenant {tenant_id}")

    async def _insert_integrations(
        self,
        conn,
        tenant_id: uuid.UUID,
        ecommerce: Dict[str, Any],
        messaging: Dict[str, Any],
        billing: Dict[str, Any],
    ) -> int:
        count = 0

        # E-commerce: ML (connected via OAuth), Amazon, Shopify
        if ecommerce.get("ml_connected"):
            await self._upsert_integration(conn, tenant_id, "mercadolibre", {
                "access_token":  ecommerce.get("ml_access_token", ""),
                "refresh_token": ecommerce.get("ml_refresh_token", ""),
                "user_id":       ecommerce.get("ml_user_id", ""),
                "nickname":      ecommerce.get("ml_nickname", ""),
            }, is_connected=True)
            count += 1

        if ecommerce.get("amazon_seller_id"):
            await self._upsert_integration(conn, tenant_id, "amazon", {
                "seller_id":      ecommerce["amazon_seller_id"],
                "marketplace_id": ecommerce.get("amazon_marketplace_id", "A1AM78C64UM0Y8"),
                "access_key":     ecommerce.get("amazon_access_key", ""),
                "secret_key":     ecommerce.get("amazon_secret_key", ""),
            })
            count += 1

        if ecommerce.get("shopify_store_url"):
            await self._upsert_integration(conn, tenant_id, "shopify", {
                "store_url":    ecommerce["shopify_store_url"],
                "access_token": ecommerce.get("shopify_access_token", ""),
            })
            count += 1

        # Messaging
        if messaging.get("wa_phone_number_id"):
            await self._upsert_integration(conn, tenant_id, "whatsapp", {
                "phone_number_id":     messaging["wa_phone_number_id"],
                "business_account_id": messaging.get("wa_business_account_id", ""),
                "access_token":        messaging.get("wa_access_token", ""),
            })
            count += 1

        if messaging.get("ig_account_id"):
            await self._upsert_integration(conn, tenant_id, "instagram", {
                "account_id":   messaging["ig_account_id"],
                "access_token": messaging.get("ig_access_token", ""),
            })
            count += 1

        if messaging.get("fb_page_id"):
            await self._upsert_integration(conn, tenant_id, "facebook", {
                "page_id":      messaging["fb_page_id"],
                "access_token": messaging.get("fb_page_access_token", ""),
            })
            count += 1

        # Billing
        if billing.get("facturama_username"):
            await self._upsert_integration(conn, tenant_id, "facturama", {
                "username": billing["facturama_username"],
                "password": billing.get("facturama_password", ""),
                "sandbox":  billing.get("facturama_sandbox", True),
            })
            count += 1

        if billing.get("facturapi_secret_key"):
            await self._upsert_integration(conn, tenant_id, "facturapi", {
                "secret_key": billing["facturapi_secret_key"],
            })
            count += 1

        logger.info(f"{count} integrations saved for tenant {tenant_id}")
        return count

    async def _upsert_integration(
        self,
        conn,
        tenant_id: uuid.UUID,
        provider: str,
        credentials: Dict[str, Any],
        is_connected: bool = False,
    ) -> None:
        encrypted = encryption.encrypt_dict(credentials)
        await conn.execute(
            """
            INSERT INTO tenant_integrations
                (tenant_id, provider, config, is_connected)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (tenant_id, provider) DO UPDATE SET
                config=EXCLUDED.config,
                is_connected=EXCLUDED.is_connected,
                updated_at=NOW()
            """,
            tenant_id, provider, encrypted, is_connected,
        )

    async def _insert_users(
        self,
        conn,
        tenant_id: uuid.UUID,
        users: List[Dict[str, Any]],
    ) -> int:
        count = 0
        for user in users:
            email = user.get("email", "").strip().lower()
            full_name = user.get("full_name", "").strip()
            role = user.get("role", "agente")

            if not email or not full_name:
                logger.warning(f"Skipping invalid user entry: {user}")
                continue

            # Temporary password — Fase 2: send via email (Resend/SendGrid)
            temp_pw = secrets.token_urlsafe(16)

            await conn.execute(
                """
                INSERT INTO users (tenant_id, email, full_name, role, password_hash)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (email) DO UPDATE SET
                    tenant_id=EXCLUDED.tenant_id,
                    full_name=EXCLUDED.full_name,
                    role=EXCLUDED.role,
                    updated_at=NOW()
                """,
                tenant_id, email, full_name, role,
                encryption.encrypt_str(temp_pw),
            )
            count += 1
            logger.info(f"User upserted: {email} ({role})")

        return count

    # ── Slug helpers ──────────────────────────────────────────────────────────

    async def _unique_slug(self, name: str) -> str:
        """Generates a slug; appends random suffix if taken."""
        base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "tenant"
        slug = base
        for _ in range(5):
            exists = await db.fetch_val(
                "SELECT COUNT(*) FROM tenants WHERE slug=$1", slug
            )
            if not exists:
                return slug
            slug = f"{base}-{secrets.token_hex(3)}"
        return f"{base}-{uuid.uuid4().hex[:8]}"

    # ── Validation ────────────────────────────────────────────────────────────

    @staticmethod
    def _validate_company(data: Dict[str, Any]) -> None:
        if not data.get("name", "").strip():
            raise ValueError("Company name is required")

    @staticmethod
    def _validate_billing(data: Dict[str, Any]) -> None:
        rfc = (data.get("rfc_emisor") or data.get("rfc", "")).upper().strip()
        if not rfc:
            raise ValueError("RFC emisor is required")
        if not re.match(r"^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$", rfc):
            raise ValueError(f"RFC format invalid: {rfc}")
        if not (data.get("razon_social") or "").strip():
            raise ValueError("Razón social is required")
        if not (data.get("regimen_fiscal") or "").strip():
            raise ValueError("Régimen fiscal is required")

    @staticmethod
    def _plan_for_limit(invoice_limit: int) -> str:
        for threshold, plan in _PLAN_THRESHOLDS:
            if invoice_limit <= threshold:
                return plan
        return "enterprise"


# Singleton
onboarding_service = OnboardingService()
