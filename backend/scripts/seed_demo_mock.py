"""
Seed datos MOCK realistas de Kap Tools para demo.
Ejecutar una vez para popular el dashboard antes de la presentación.

Uso:
    cd backend
    SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=... python scripts/seed_demo_mock.py

    O con .env:
    python scripts/seed_demo_mock.py

Requiere:
    - Migración 001, 002, 003 ya aplicadas en Supabase
    - SUPABASE_URL + SUPABASE_SERVICE_KEY en el entorno
    - ENCRYPTION_KEY en el entorno (para cifrar config de integraciones)
"""

from __future__ import annotations

import os
import sys
import uuid
import random
import traceback
from datetime import datetime, timedelta, timezone

# ── Path setup ────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local"), override=True)

from supabase import create_client, Client
from src.utils.encryption import EncryptionHelper
import psycopg2
from psycopg2.extras import RealDictCursor

# ── Config ────────────────────────────────────────────────────────────────────

DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_KEY")    # service role (bypasses RLS) — preferred
    or os.getenv("SUPABASE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

conn = None
supabase = None

if DATABASE_URL:
    print("🔌 Conectando directo a PostgreSQL vía DATABASE_URL...")
    conn = psycopg2.connect(DATABASE_URL)
elif SUPABASE_URL and SUPABASE_KEY:
    print("🌐 Usando Supabase API (ATENCIÓN: puede sufrir de caché de esquema)...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("❌ ERROR: Necesitas DATABASE_URL (recomendado) o SUPABASE_URL y SUPABASE_SERVICE_KEY en el entorno.")
    print("   Añade al .env o pasa como variables de entorno.")
    sys.exit(1)

encryption = EncryptionHelper()

now = datetime.now(timezone.utc)

# ── Helpers ───────────────────────────────────────────────────────────────────

def ts(days_ago: float = 0, hours_ago: float = 0) -> str:
    """ISO timestamp shifted by the given offset."""
    delta = timedelta(days=days_ago, hours=hours_ago)
    return (now - delta).isoformat()

def uid() -> str:
    return str(uuid.uuid4())

def upsert(table: str, data: dict, conflict_col: str | None = None) -> dict | None:
    if conn:
        # Psycopg2 direct insert
        keys = list(data.keys())
        values = tuple(data.values())
        cols_str = ", ".join(f'"{k}"' for k in keys)
        vals_str = ", ".join("%s" for k in keys)
        
        if conflict_col:
            # Handle multiple conflict columns e.g. "tenant_id,sku"
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
            if "does not exist" in msg or "relation" in msg:
                print(f"   ⚠️  Tabla '{table}' no existe — aplica migración 003 primero. Saltando.")
                return None
            if "duplicate" in msg or "unique" in msg:
                print(f"   ↩️  Registro ya existe en '{table}' — saltando duplicado.")
                return None
            print(f"   ❌ Error en '{table}': {msg[:120]}")
            return None
    else:
        # Supabase API fallback
        try:
            if conflict_col:
                result = supabase.table(table).upsert(data, on_conflict=conflict_col).execute()
            else:
                result = supabase.table(table).insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as exc:
            msg = str(exc)
            if "does not exist" in msg or "relation" in msg:
                print(f"   ⚠️  Tabla '{table}' no existe — aplica migración 003 primero. Saltando.")
                return None
            if "duplicate" in msg or "unique" in msg:
                print(f"   ↩️  Registro ya existe en '{table}' — saltando duplicado.")
                return None
            print(f"   ❌ Error en '{table}': {msg[:120]}")
            return None


# ── Seed data ─────────────────────────────────────────────────────────────────

PRODUCTOS = [
    {"sku": "DEST-001", "name": "Destornillador Phillips #2",        "price": 89.00,    "cost": 42.00,  "stock": 156, "brand": "Kap Tools"},
    {"sku": "MART-001", "name": "Martillo de Goma 16oz",             "price": 145.00,   "cost": 65.00,  "stock": 89,  "brand": "Kap Tools"},
    {"sku": "LLAVE-001","name": "Llave Ajustable 10 pulgadas",        "price": 234.00,   "cost": 112.00, "stock": 67,  "brand": "Kap Tools"},
    {"sku": "TAL-001",  "name": "Taladro Inalámbrico 20V",            "price": 1899.00,  "cost": 920.00, "stock": 23,  "brand": "Kap Power"},
    {"sku": "SIE-001",  "name": 'Sierra Circular 7-1/4"',             "price": 2150.00,  "cost": 980.00, "stock": 12,  "brand": "Kap Power"},
    {"sku": "NIV-001",  "name": 'Nivel de Burbuja 24"',               "price": 156.00,   "cost": 72.00,  "stock": 45,  "brand": "Kap Tools"},
    {"sku": "CIN-001",  "name": "Cinta Métrica 5m",                   "price": 67.00,    "cost": 28.00,  "stock": 234, "brand": "Kap Tools"},
    {"sku": "PIN-001",  "name": 'Pinzas de Presión 10"',              "price": 178.00,   "cost": 80.00,  "stock": 78,  "brand": "Kap Tools"},
    {"sku": "LIJ-001",  "name": "Papel Lija Grano 80 (pack 10)",      "price": 45.00,    "cost": 18.00,  "stock": 567, "brand": "Kap Basic"},
    {"sku": "BRO-001",  "name": "Brocha 3 pulgadas",                  "price": 34.00,    "cost": 14.00,  "stock": 123, "brand": "Kap Basic"},
]

CLIENTES = [
    {"name": "Ferretería Central SA de CV",    "email": "compras@ferreteria-central.com", "rfc": "FCS850101XXX", "city": "Puebla"},
    {"name": "Construcciones del Norte SA de CV","email": "adq@cdnorte.com",              "rfc": "CDN900501XXX", "city": "Monterrey"},
    {"name": "Juan Pérez López",                "email": "juan.perez@gmail.com",           "rfc": "PELJ880312XXX","city": "Puebla"},
    {"name": "María González Ruiz",             "email": "maria.gzlez@hotmail.com",        "rfc": "GORM920815XXX","city": "México"},
    {"name": "Taller Mecánico Rodríguez",       "email": "taller@rodriguez.com",           "rfc": "TMR010101XXX", "city": "Tlaxcala"},
]

CHANNELS     = ["mercadolibre", "shopify", "direct"]
CHANNEL_W    = [0.60, 0.25, 0.15]
ORDER_STATUS = ["paid", "shipped", "delivered"]
STATUS_W     = [0.15, 0.30, 0.55]


def seed_demo() -> None:
    print("\n🚀  Iniciando seed demo Kap Tools — KINEXIS\n")

    # ── 1. Tenant ─────────────────────────────────────────────────────────────
    tenant_id = uid()
    result = upsert("tenants", {
        "id":                     tenant_id,
        "name":                   "Kap Tools",
        "slug":                   "kap-tools-demo",
        "rfc":                    "KAP850101ABC",
        "legal_name":             "Kap Tools SA de CV",
        "email":                  "contacto@kaptools.com",
        "phone":                  "2221234567",
        "address":                "Av. Principal 100, San Andrés Cholula, Puebla, C.P. 72810",
        "plan":                   "growth",
        "status":                 "active",
        "onboarding_completed":   True,
        "onboarding_completed_at": ts(),
        "created_at":             ts(30),
    }, conflict_col="slug")

    if result:
        tenant_id = result["id"]
        print(f"✅  Tenant creado: {tenant_id}")
    else:
        # ON CONFLICT DO UPDATE returned nothing — fetch existing row
        if conn:
            with conn.cursor() as cur:
                cur.execute('SELECT id FROM tenants WHERE slug = %s', ("kap-tools-demo",))
                row = cur.fetchone()
                if row:
                    tenant_id = str(row[0])
                    print(f"↩️   Tenant ya existe: {tenant_id}")
                else:
                    print("❌  No se pudo crear ni recuperar el tenant. Abortando.")
                    sys.exit(1)
        else:
            existing = supabase.table("tenants").select("id").eq("slug", "kap-tools-demo").execute()
            if existing.data:
                tenant_id = existing.data[0]["id"]
                print(f"↩️   Tenant ya existe: {tenant_id}")
            else:
                print("❌  No se pudo crear ni recuperar el tenant. Abortando.")
                sys.exit(1)

    # ── 2. Fiscal config ──────────────────────────────────────────────────────
    upsert("tenant_fiscal_config", {
        "tenant_id":                   tenant_id,
        "rfc":                         "KAP850101ABC",
        "razon_social":                "Kap Tools SA de CV",
        "regimen_fiscal":              "601",
        "codigo_postal":               "72810",
        "invoice_limit_monthly":       150,
        "invoices_used_current_month": 23,
        "current_period_start":        datetime(now.year, now.month, 1).date().isoformat(),
    }, conflict_col="tenant_id")
    print("✅  Config fiscal creada (150 timbres/mes, 23 usados)")

    # ── 3. Usuario owner ──────────────────────────────────────────────────────
    upsert("users", {
        "id":             uid(),
        "tenant_id":      tenant_id,
        "email":          "owner@kaptools.com",
        "full_name":      "Carlos Kap",
        "role":           "owner",
        "is_active":      True,
        "email_confirmed":True,
        "created_at":     ts(30),
    }, conflict_col="email")
    upsert("users", {
        "id":             uid(),
        "tenant_id":      tenant_id,
        "email":          "ventas@kaptools.com",
        "full_name":      "Ana Ventas",
        "role":           "agente",
        "is_active":      True,
        "email_confirmed":True,
        "created_at":     ts(25),
    }, conflict_col="email")
    print("✅  Usuarios creados (owner + agente)")

    # ── 4. Integración ML ─────────────────────────────────────────────────────
    # Railway (psycopg2): config es JSONB → pasar dict con json.dumps
    # Supabase (API):     config es TEXT  → pasar Fernet-encrypted string
    _ml_payload = {"demo": True, "note": "Datos simulados para demo Kap Tools", "ml_user_id": "123456789"}
    if conn:
        import json as _json
        ml_config: str | dict = _json.dumps(_ml_payload)   # JSONB accepts JSON string
    else:
        ml_config = encryption.encrypt_dict(_ml_payload)   # TEXT column on Supabase

    upsert("tenant_integrations", {
        "id":              uid(),
        "tenant_id":       tenant_id,
        "provider":        "mercadolibre",
        "config":          ml_config,
        "is_enabled":      True,
        "is_connected":    True,
        "last_test_at":    ts(1),
        "last_test_result":{"ok": True, "latency_ms": 142},
    }, conflict_col="tenant_id,provider")
    print("✅  Integración ML configurada (is_connected=true)")

    # ── 5. Productos ──────────────────────────────────────────────────────────
    product_ids: list[str] = []
    for p in PRODUCTOS:
        pid = uid()
        result = upsert("products", {
            "id":          pid,
            "tenant_id":   tenant_id,
            "sku":         p["sku"],
            "name":        p["name"],
            "price":       p["price"],
            "cost":        p["cost"],
            "stock":       p["stock"],
            "ml_item_id":  f"MLM{random.randint(100_000_000, 999_999_999)}",
            "category":    "Herramientas",
            "brand":       p["brand"],
            "is_active":   True,
            "created_at":  ts(random.randint(20, 60)),
        }, conflict_col="tenant_id,sku")
        if result:
            product_ids.append(result["id"])

    if product_ids:
        print(f"✅  {len(product_ids)} productos creados")
    else:
        print("⚠️   Productos no creados (migración 003 pendiente o duplicados)")

    # ── 6. Clientes ───────────────────────────────────────────────────────────
    customer_ids: list[str] = []
    for c in CLIENTES:
        cid = uid()
        result = upsert("customers", {
            "id":          cid,
            "tenant_id":   tenant_id,
            "name":        c["name"],
            "email":       c["email"],
            "rfc":         c["rfc"],
            "city":        c["city"],
            "state":       "Puebla",
            "country":     "MX",
            "ml_user_id":  str(random.randint(100_000_000, 999_999_999)),
            "created_at":  ts(random.randint(10, 60)),
        }, conflict_col=None)
        if result:
            customer_ids.append(result["id"])

    if customer_ids:
        print(f"✅  {len(customer_ids)} clientes creados")
    else:
        print("⚠️   Clientes no creados (migración 003 pendiente)")

    # ── 7. Órdenes ────────────────────────────────────────────────────────────
    orders_created = 0
    if customer_ids and product_ids:
        for i in range(50):
            days_ago  = random.uniform(0, 30)
            channel   = random.choices(CHANNELS, weights=CHANNEL_W)[0]
            status    = random.choices(ORDER_STATUS, weights=STATUS_W)[0]
            n_items   = random.randint(1, 4)
            sampled   = random.sample(PRODUCTOS, min(n_items, len(PRODUCTOS)))
            subtotal  = sum(p["price"] * random.randint(1, 3) for p in sampled)
            tax       = round(subtotal * 0.16, 2)
            shipping  = random.choice([0, 50, 100, 150])
            total     = round(subtotal + tax + shipping, 2)

            order_row = {
                "id":               uid(),
                "tenant_id":        tenant_id,
                "customer_id":      random.choice(customer_ids),
                "order_number":     f"KAP-2026-{i+1:04d}",
                "channel":          channel,
                "ml_order_id":      str(random.randint(10**9, 10**10 - 1)) if channel == "mercadolibre" else None,
                "subtotal":         float(round(subtotal, 2)),
                "tax":              float(tax),
                "shipping":         float(shipping),
                "total":            float(total),
                "status":           status,
                "payment_status":   "paid",
                "fulfillment_status": status,
                "created_at":       ts(days_ago),
            }
            order_result = upsert("orders", order_row)
            if not order_result:
                break

            order_id = order_result["id"]
            orders_created += 1

            for p in sampled:
                qty = random.randint(1, 3)
                upsert("order_items", {
                    "id":         uid(),
                    "order_id":   order_id,
                    "sku":        p["sku"],
                    "name":       p["name"],
                    "quantity":   qty,
                    "unit_price": float(p["price"]),
                    "total":      float(p["price"] * qty),
                })

        if orders_created:
            print(f"✅  {orders_created} órdenes creadas con items")
        else:
            print("⚠️   Órdenes no creadas (migración 003 pendiente)")
    else:
        print("⚠️   Órdenes saltadas — sin clientes o productos")

    # ── 8. Facturas CFDI ──────────────────────────────────────────────────────
    RECEPTORES = [c["name"] for c in CLIENTES]
    RECEPTORES_RFC = [c["rfc"] for c in CLIENTES]

    invoices_created = 0
    for i in range(23):
        days_ago    = random.uniform(0, 30)
        total_mxn   = round(random.uniform(800, 15_000), 2)
        subtotal    = round(total_mxn / 1.16, 2)
        tax         = round(total_mxn - subtotal, 2)
        idx         = random.randint(0, len(RECEPTORES) - 1)
        is_cancelled = i < 2   # primeros 2 cancelados para mostrar ambos estados

        result = upsert("cfdi_invoices", {
            "id":               uid(),
            "tenant_id":        tenant_id,
            "uuid":             str(uuid.uuid4()),   # UUID válido de 36 chars
            "folio_number":     f"F-2026-{i+1:03d}",
            "serie":            "A",
            "issuer_rfc":       "KAP850101ABC",
            "issuer_name":      "Kap Tools SA de CV",
            "receiver_rfc":     RECEPTORES_RFC[idx],
            "receiver_name":    RECEPTORES[idx],
            "subtotal":         float(subtotal),
            "tax":              float(tax),
            "total":            float(total_mxn),
            "currency":         "MXN",
            "payment_form":     "03",
            "payment_method":   "PUE",
            "cfdi_use":         "G03",
            "provider":         "facturama",
            "status":           "cancelled" if is_cancelled else "valid",
            "cancelled_at":     ts(days_ago - 0.1) if is_cancelled else None,
            "cancellation_motive": "01" if is_cancelled else None,
            "created_at":       ts(days_ago),
        })
        if result:
            invoices_created += 1

    print(f"✅  {invoices_created} facturas CFDI creadas (21 válidas, 2 canceladas)")

    # ── Resumen ───────────────────────────────────────────────────────────────
    print("\n" + "─" * 50)
    print("🎉  SEED COMPLETADO — Kap Tools Demo")
    print("─" * 50)
    print(f"   Tenant ID   : {tenant_id}")
    print(f"   Tenant Slug : kap-tools-demo")
    print(f"   Login       : owner@kaptools.com")
    print(f"   Productos   : {len(product_ids)}")
    print(f"   Clientes    : {len(customer_ids)}")
    print(f"   Órdenes     : {orders_created}")
    print(f"   Facturas    : {invoices_created}")
    print("─" * 50)
    print("\n✅  Dashboard listo para demo!\n")


if __name__ == "__main__":
    try:
        seed_demo()
    except KeyboardInterrupt:
        print("\n⛔  Seed cancelado por el usuario.")
        sys.exit(0)
    except Exception:
        print("\n❌  Error inesperado:")
        traceback.print_exc()
        sys.exit(1)
