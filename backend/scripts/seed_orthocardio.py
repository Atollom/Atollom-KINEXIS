"""
Seed data directo para tenant Orthocardio (pruebas) usando psycopg2.
Ejecución: python scripts/seed_orthocardio.py
"""

import os
import sys
import uuid
import random
import traceback
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta, timezone

# ── Env Setup ─────────────────────────────────────────────────────────────────
# Asegurar que se cargan las variables si se corre localmente
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
except ImportError:
    pass

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: Necesitas DATABASE_URL en el entorno (ej. en backend/.env).")
    print("   El formato es postgresql://user:pass@host:port/dbname")
    sys.exit(1)

now = datetime.now(timezone.utc)

def ts(days_ago: float = 0, hours_ago: float = 0) -> str:
    """ISO timestamp shifted by the given offset."""
    delta = timedelta(days=days_ago, hours=hours_ago)
    return (now - delta).isoformat()

def uid() -> str:
    return str(uuid.uuid4())

def upsert_pg(conn, table: str, data: dict, conflict_col: str | None = None) -> dict | None:
    keys = list(data.keys())
    values = tuple(data.values())
    cols_str = ", ".join(f'"{k}"' for k in keys)
    vals_str = ", ".join("%s" for k in keys)
    
    if conflict_col:
        conflict_cols_list = [c.strip() for c in conflict_col.split(',')]
        conflict_str = ", ".join(f'"{c}"' for c in conflict_cols_list)
        update_cols = [k for k in keys if k not in conflict_cols_list]
        
        if update_cols:
            update_str = ", ".join(f'"{k}" = EXCLUDED."{k}"' for k in update_cols)
            query = f'INSERT INTO "{table}" ({cols_str}) VALUES ({vals_str}) ON CONFLICT ({conflict_str}) DO UPDATE SET {update_str} RETURNING *'
        else:
            query = f'INSERT INTO "{table}" ({cols_str}) VALUES ({vals_str}) ON CONFLICT ({conflict_str}) DO NOTHING RETURNING *'
    else:
        query = f'INSERT INTO "{table}" ({cols_str}) VALUES ({vals_str}) RETURNING *'

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            conn.commit()
            return dict(row) if row else None
    except Exception as exc:
        conn.rollback()
        msg = str(exc)
        if "duplicate" in msg or "unique" in msg:
            print(f"   ↩️  Registro ya existe en '{table}' — saltando duplicado.")
            return None
        print(f"   ❌ Error en '{table}': {msg[:120]}")
        return None

def seed_orthocardio():
    print("\n🚀  Iniciando seed ORTHOCARDIO vía psycopg2 directo\n")
    
    conn = psycopg2.connect(DATABASE_URL)
    print("🔌 Conectado exitosamente a PostgreSQL.")

    # 1. TENANT
    tenant_id = uid()
    result = upsert_pg(conn, "tenants", {
        "id": tenant_id,
        "name": "Orthocardio",
        "slug": "orthocardio",
        "rfc": "ORT850101ABC",
        "legal_name": "Orthocardio SA de CV",
        "plan": "starter",
        "status": "active",
        "onboarding_completed": True,
        "onboarding_completed_at": ts(),
        "created_at": ts(30),
    }, conflict_col="slug")

    if result:
        tenant_id = result["id"]
        print(f"✅  Tenant creado: {tenant_id}")
    else:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM tenants WHERE slug = 'orthocardio'")
            existing = cur.fetchone()
            if existing:
                tenant_id = existing["id"]
                print(f"↩️   Tenant ya existe: {tenant_id}")
            else:
                print("❌  No se pudo crear ni recuperar el tenant. Abortando.")
                sys.exit(1)

    # 2. CONFIG FISCAL
    upsert_pg(conn, "tenant_fiscal_config", {
        "tenant_id": tenant_id,
        "rfc": "ORT850101ABC",
        "razon_social": "Orthocardio SA de CV",
        "regimen_fiscal": "612",
        "codigo_postal": "72000",
        "invoice_limit_monthly": 100,
        "invoices_used_current_month": 5,
        "current_period_start": datetime(now.year, now.month, 1).date().isoformat(),
    }, conflict_col="tenant_id")
    print("✅  Config fiscal creada (Régimen 612)")

    # 3. USUARIOS (3)
    usuarios = [
        {"email": "admin@orthocardio.com", "name": "Dr. Roberto Ortiz", "role": "admin"},
        {"email": "almacen@orthocardio.com", "name": "Ana Martínez", "role": "almacenista"},
        {"email": "ventas@orthocardio.com", "name": "Carlos Ramírez", "role": "agente"},
    ]
    
    users_created = 0
    for u in usuarios:
        if upsert_pg(conn, "users", {
            "id": uid(),
            "tenant_id": tenant_id,
            "email": u["email"],
            "full_name": u["name"],
            "role": u["role"],
            "is_active": True,
            "email_confirmed": True,
            "created_at": ts(10),
        }, conflict_col="email"):
            users_created += 1
            
    print(f"✅  {users_created} usuarios creados/actualizados")

    # 4. FACTURAS CFDI (5) - NO PRODUCTOS
    invoices_created = 0
    for i in range(5):
        days_ago = random.uniform(0, 30)
        total_mxn = round(random.uniform(2500, 8000), 2)
        subtotal = round(total_mxn / 1.16, 2)
        tax = round(total_mxn - subtotal, 2)

        result = upsert_pg(conn, "cfdi_invoices", {
            "id": uid(),
            "tenant_id": tenant_id,
            "uuid": str(uuid.uuid4()),
            "folio_number": f"ORT-2026-{i+1:03d}",
            "serie": "A",
            "issuer_rfc": "ORT850101ABC",
            "issuer_name": "Orthocardio SA de CV",
            "receiver_rfc": "XAXX010101000", # Público en general
            "receiver_name": "Público en General",
            "subtotal": float(subtotal),
            "tax": float(tax),
            "total": float(total_mxn),
            "currency": "MXN",
            "payment_form": "03", # Transferencia
            "payment_method": "PUE",
            "cfdi_use": "G03", # Gastos en general
            "provider": "facturama",
            "status": "valid",
            "created_at": ts(days_ago),
        })
        if result:
            invoices_created += 1

    print(f"✅  {invoices_created} facturas CFDI creadas (Servicios médicos)")

    conn.close()

    print("\n" + "─" * 50)
    print("🎉  SEED COMPLETADO — Orthocardio Demo")
    print("─" * 50)
    print(f"   Tenant ID   : {tenant_id}")
    print(f"   Usuarios    : {users_created}")
    print(f"   Facturas    : {invoices_created}")
    print(f"   Productos   : 0 (Servicios)")
    print("─" * 50)
    print("\n✅  Dashboard Orthocardio listo para demo!\n")

if __name__ == "__main__":
    try:
        seed_orthocardio()
    except Exception:
        print("\n❌  Error inesperado:")
        traceback.print_exc()
        sys.exit(1)
