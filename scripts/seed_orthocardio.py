"""
Seed data para tenant Orthocardio (pruebas)
- 50 productos
- 100 órdenes
- 20 clientes
"""
import os
import sys
from supabase import create_client
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv

# Reconfigurar stdout para utf-8 en caso de ser necesario, aunque remover emojis es más seguro
sys.stdout.reconfigure(encoding='utf-8')

# Cargar variables de entorno desde .env
load_dotenv()

# Conectar a Supabase
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("[Error] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontrados en .env")
    exit(1)

supabase = create_client(url, key)

TENANT_ID = "orthocardio-test-tenant-id"  # Fallback

try:
    # Intentar obtener el ID real de Orthocardio si existe una tabla tenants
    res = supabase.table("tenants").select("id").ilike("name", "%orthocardio%").execute()
    if res.data and len(res.data) > 0:
        TENANT_ID = res.data[0]["id"]
        print(f"[OK] Tenant ID real encontrado: {TENANT_ID}")
    else:
        print(f"[Warn] No se encontro tenant Orthocardio, usando fallback: {TENANT_ID}")
except Exception as e:
    print(f"[Warn] No se pudo consultar la tabla tenants (usando fallback): {e}")

# 1. PRODUCTOS (50)
productos = []
for i in range(1, 51):
    productos.append({
        "tenant_id": TENANT_ID,
        "sku": f"ORTH-{i:04d}",
        "name": f"Producto Medico {i}",
        "description": f"Descripcion del producto {i}",
        "cost": round(random.uniform(50, 500), 2),
        "price": round(random.uniform(100, 1000), 2),
        "stock": random.randint(0, 100),
        "category": random.choice(["Equipos", "Consumibles", "Instrumental"])
    })

try:
    supabase.table("products").insert(productos).execute()
    print(f"[OK] {len(productos)} productos creados")
except Exception as e:
    print(f"[Error] Error insertando productos: {e}")

# 2. CLIENTES (20)
clientes = []
for i in range(1, 21):
    clientes.append({
        "tenant_id": TENANT_ID,
        "name": f"Cliente {i}",
        "email": f"cliente{i}@example.com",
        "phone": f"+52155{random.randint(1000000, 9999999)}",
        "rfc": f"CLI{i:06d}XXX",
        "type": random.choice(["B2B", "B2C"])
    })

try:
    supabase.table("customers").insert(clientes).execute()
    print(f"[OK] {len(clientes)} clientes creados")
except Exception as e:
    print(f"[Error] Error insertando clientes: {e}")

# 3. ÓRDENES (100)
ordenes = []
base_date = datetime.now() - timedelta(days=90)

for i in range(1, 101):
    order_date = base_date + timedelta(days=random.randint(0, 90))
    ordenes.append({
        "tenant_id": TENANT_ID,
        "order_id": f"ORD-{i:06d}",
        "customer_id": random.choice([c["email"] for c in clientes]),
        "total": round(random.uniform(500, 10000), 2),
        "status": random.choice(["pending", "completed", "shipped", "cancelled"]),
        "platform": random.choice(["mercadolibre", "shopify", "b2b_directo"]),
        "created_at": order_date.isoformat()
    })

try:
    supabase.table("orders").insert(ordenes).execute()
    print(f"[OK] {len(ordenes)} ordenes creadas")
except Exception as e:
    print(f"[Error] Error insertando ordenes: {e}")

print("\n[Completado] Datos fake para Orthocardio generados correctamente.")
