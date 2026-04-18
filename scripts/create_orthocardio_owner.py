"""
Script para crear el usuario OWNER de Orthocardio
"""
import os
import time
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Conectar
supabase = None
for i in range(3):
    try:
        supabase = create_client(url, key)
        break
    except Exception as e:
        print(f"Error conectando (intento {i+1}): {e}")
        time.sleep(1)

if not supabase:
    print("No se pudo conectar a Supabase.")
    exit(1)

TENANT_ID = "d0e84000-e29b-41d4-a716-446655440002"
EMAIL = "admin@orthocardio.com"
PASSWORD = "Admin2026"
ROLE = "admin"

try:
    user_id = None
    # 1. Verificar si ya existe en Auth
    users_res = supabase.auth.admin.list_users()
    existing_user = next((u for u in users_res if u.email == EMAIL), None)

    if existing_user:
        user_id = existing_user.id
        print(f"Usuario {EMAIL} ya existe en Auth (ID: {user_id})")
    else:
        # 2. Crear si no existe
        auth_res = supabase.auth.admin.create_user({
            "email": EMAIL,
            "password": PASSWORD,
            "email_confirm": True,
            "user_metadata": {"role": ROLE}
        })
        user_id = auth_res.user.id
        print(f"Usuario {EMAIL} creado en Auth (ID: {user_id})")

    # 3. Upsert Perfil
    profile_data = {
        "id": user_id,
        "email": EMAIL,
        "role": ROLE,
        "tenant_id": TENANT_ID,
        "display_name": "Propietario OrthoCardio"
    }
    supabase.table("user_profiles").upsert(profile_data, on_conflict="id").execute()
    print(f"OK: Perfil de {EMAIL} configurado como {ROLE}")

except Exception as e:
    print(f"Error en el proceso: {e}")

print("Proceso finalizado.")
