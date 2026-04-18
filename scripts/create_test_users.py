"""
Script para crear usuarios de prueba en Orthocardio
Roles: agente (ventas), almacenista (almacen)
"""
import os
import time
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# IDs
ORTHOCARDIO_TENANT = "d0e84000-e29b-41d4-a716-446655440002"

# Reintento de conexión por problemas de DNS
supabase = None
for i in range(5):
    try:
        supabase = create_client(url, key)
        # Test basic connectivity
        supabase.table("tenants").select("id").limit(1).execute()
        break
    except Exception as e:
        print(f"Fallo de conexión (Intento {i+1}): {e}")
        time.sleep(2)

if not supabase:
    print("No se pudo conectar a Supabase.")
    exit(1)

usuarios = [
    {
        "email": "ventas@orthocardio.com",
        "password": "Ventas2026",
        "role": "agente",
        "display_name": "Agente de Ventas Ortho"
    },
    {
        "email": "almacen@orthocardio.com",
        "password": "Almacen2026",
        "role": "almacenista",
        "display_name": "Gestor de Almacén Ortho"
    }
]

for user in usuarios:
    # 1. Crear en Auth (Admin API)
    # Buscamos si ya existe para evitar errores
    try:
        user_id = None
        # Buscar si existe
        users_res = supabase.auth.admin.list_users()
        existing_user = next((u for u in users_res if u.email == user["email"]), None)
        
        if existing_user:
            user_id = existing_user.id
            print(f"Usuario {user['email']} ya existe (ID: {user_id})")
        else:
            # Crear si no existe
            auth_res = supabase.auth.admin.create_user({
                "email": user["email"],
                "password": user["password"],
                "email_confirm": True,
                "user_metadata": {"role": user["role"]}
            })
            user_id = auth_res.user.id
            print(f"User {user['email']} creado en Auth (ID: {user_id})")
    except Exception as e:
        print(f"Error procesando Auth para {user['email']}: {e}")
        continue




    # 2. Upsert Perfil
    try:
        profile_data = {
            "id": user_id,
            "email": user["email"],
            "role": user["role"],
            "tenant_id": ORTHOCARDIO_TENANT,
            "display_name": user["display_name"]
        }
        # Usamos upsert para ser idempotentes (id es PK)
        supabase.table("user_profiles").upsert(profile_data, on_conflict="id").execute()
        print(f"OK: Perfil de {user['email']} configurado como {user['role']}")
    except Exception as e:
        print(f"Error configurando perfil para {user['email']}: {e}")

print("\nProceso de creacion de usuarios finalizado.")

