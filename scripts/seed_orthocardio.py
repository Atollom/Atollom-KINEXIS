"""
Seed data para tenant Orthocardio (Comercializadora Ortho Cardio)
- 50 productos (con inventario)
- 100 órdenes
- 20 clientes
"""
import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

# Cargar variables de entorno
load_dotenv()

# Conectar a Supabase
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontradas en el entorno.")
    exit(1)

supabase = create_client(url, key)

# ID Real de Ortho Cardio (detectado en scripts/seed_ortho_cardio.sql)
TENANT_ID = "d0e84000-e29b-41d4-a716-446655440002"

def run_seed():
    print(f"Iniciando seed para Tenant: {TENANT_ID}")
    
    # --- LIMPIEZA PREVIA ---
    print("Limpiando datos previos de Orthocardio...")
    try:
        # El orden es importante por las claves foráneas si las hubiera (en este caso no parece haber restricciones fuertes de borrado, pero vamos en cascada lógica)
        supabase.table("inventory").delete().eq("tenant_id", TENANT_ID).execute()
        supabase.table("order_items").delete().eq("tenant_id", TENANT_ID).execute()
        supabase.table("orders").delete().eq("tenant_id", TENANT_ID).execute()
        supabase.table("products").delete().eq("tenant_id", TENANT_ID).execute()
        supabase.table("leads").delete().eq("tenant_id", TENANT_ID).execute()
        print("Limpieza completada.")
    except Exception as e:
        print(f"Aviso en limpieza: {e}")

    # 1. PRODUCTOS e INVENTARIO (50)
    productos = []
    inventario = []
    categorias = ["Cardio", "Surgical", "Basic", "Imaging", "Ortho"]
    
    for i in range(1, 51):
        sku = f"ORTH-{i:04d}"
        cost = round(random.uniform(50, 500), 2)
        price = round(cost * random.uniform(1.5, 3.0), 2)
        
        productos.append({
            "tenant_id": TENANT_ID,
            "sku": sku,
            "name": f"Producto Médico {i}",
            "description": f"Descripción profesional del equipo/insumo médico {i}",
            "cost": cost,
            "base_price": price,
            "category": random.choice(categorias)
        })
        
        inventario.append({
            "tenant_id": TENANT_ID,
            "sku": sku,
            "stock": random.randint(10, 200),
            "warehouse_location": f"Aisle {random.randint(1, 10)}-{random.choice(['A', 'B', 'C'])}"
        })

    supabase.table("products").insert(productos).execute()
    supabase.table("inventory").insert(inventario).execute()
    print(f"OK: {len(productos)} productos e inventario creados")

    # 2. CLIENTES (usando tabla 'leads') (20)
    leads = []
    for i in range(1, 21):
        leads.append({
            "tenant_id": TENANT_ID,
            "name": f"Cliente Médico {i}",
            "email": f"cliente{i}@ortho-test.com",
            "phone": f"+52155{random.randint(1000000, 9999999)}",
            "type": random.choice(["b2b", "b2c"]),
            "source": "seed_script",
            "deal_stage": "discovery"
        })

    supabase.table("leads").insert(leads).execute()
    print(f"OK: {len(leads)} clientes creados en tabla 'leads'")

    # 3. ÓRDENES (100)
    ordenes = []
    base_date = datetime.now() - timedelta(days=90)
    platforms = ["ml", "amazon", "shopify", "b2b"]
    statuses = ["APPROVED", "SENT", "DELIVERED", "CANCELLED"]

    for i in range(1, 101):
        order_date = base_date + timedelta(days=random.randint(0, 90))
        customer = random.choice(leads)
        
        ordenes.append({
            "tenant_id": TENANT_ID,
            "external_id": f"ORD-{i:06d}",
            "customer_name": customer["name"],
            "total": round(random.uniform(500, 15000), 2),
            "status": random.choice(statuses),
            "platform": random.choice(platforms),
            "created_at": order_date.isoformat()
        })

    supabase.table("orders").insert(ordenes).execute()
    print(f"OK: {len(ordenes)} órdenes creadas")

    print("\nSeed data para Orthocardio completado exitosamente")

if __name__ == "__main__":
    run_seed()


