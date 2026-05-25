"""
FacturAPI Service — manages organization creation per tenant.

KINEXIS acts as a distributor: one FACTURAPI_USER_KEY creates one
Organization per tenant RFC. The org's secret key is stored in
tenant_fiscal_config and used for all CFDI timbrado for that tenant.
"""

import logging
from typing import Optional

from src.integrations.facturapi.client import FacturapiClient
from src.utils.database import db

logger = logging.getLogger(__name__)


class FacturapiService:
    """Creates and manages FacturAPI organizations per tenant."""

    def __init__(self) -> None:
        self._client: Optional[FacturapiClient] = None

    @property
    def client(self) -> FacturapiClient:
        if self._client is None:
            self._client = FacturapiClient()
        return self._client

    async def create_organization_for_tenant(
        self,
        tenant_id: str,
        legal_name: str,
        rfc: str,
        regimen_fiscal: str,
        codigo_postal: str,
    ) -> Optional[str]:
        """
        Creates a FacturAPI organization for the tenant and persists the org ID.

        Returns:
            FacturAPI org ID string, or None if creation fails.
        """
        if not rfc or not regimen_fiscal or not codigo_postal:
            logger.warning(
                "[FACTURAPI] Skipping org creation for tenant=%s — missing RFC/régimen/CP",
                tenant_id,
            )
            return None

        try:
            org_data = await self.client.create_organization(
                legal_name=legal_name,
                tax_id=rfc,
                tax_system=regimen_fiscal,
                zip=codigo_postal,
            )
            org_id: Optional[str] = org_data.get("id")

            if not org_id:
                logger.error(
                    "[FACTURAPI] No 'id' in response for tenant=%s: %s",
                    tenant_id, org_data,
                )
                return None

            # Persist org ID in tenants table
            await db.execute(
                "UPDATE tenants SET facturapi_org_id=$1, updated_at=NOW() WHERE id=$2::uuid",
                org_id, tenant_id,
            )

            # Also store in tenant_fiscal_config if the row exists
            try:
                await db.execute(
                    """
                    UPDATE tenant_fiscal_config
                    SET facturapi_org_id=$1, updated_at=NOW()
                    WHERE tenant_id=$2::uuid
                    """,
                    org_id, tenant_id,
                )
            except Exception:
                pass  # column may not exist yet on older migrations

            logger.info(
                "[FACTURAPI] Organization created: org_id=%s for tenant=%s rfc=%s",
                org_id, tenant_id, rfc,
            )
            return org_id

        except Exception as exc:
            logger.error(
                "[FACTURAPI] Organization creation failed for tenant=%s: %s",
                tenant_id, exc,
            )
            return None

    async def get_org_id_for_tenant(self, tenant_id: str) -> Optional[str]:
        """Returns stored FacturAPI org ID for a tenant, or None."""
        row = await db.fetch_one(
            "SELECT facturapi_org_id FROM tenants WHERE id=$1::uuid",
            tenant_id,
        )
        return row["facturapi_org_id"] if row else None


facturapi_service = FacturapiService()
