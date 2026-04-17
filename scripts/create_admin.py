import os
import time
from dotenv import load_dotenv
from supabase import create_client

# Cargar variables de entorno
load_dotenv()

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("Error: Faltan credenciales de Supabase en el archivo .env")
    exit(1)

def setup_admin():
    print(f"URL: {URL}")
    print("Intentando conectar a Supabase...")
    
    # Reintentos para DNS inestable
    for attempt in range(3):
        try:
            supabase = create_client(URL, KEY)
            print(f"Intento {attempt + 1}: Conexión establecida.")
            
            EMAIL = "contacto@atollom.com"
            PASSWORD = "Atollom2026"
            TENANT_ID = "40446806-0107-6201-9311-000000000001"

            print(f"Verificando usuario: {EMAIL}")
            # Operación simple para probar red
            existing_users = supabase.auth.admin.list_users()
            user_id = None
            
            for user in existing_users:
                if user.email == EMAIL:
                    user_id = user.id
                    print(f"Usuario ya existe: {user_id}")
                    break
            
            if not user_id:
                user_resp = supabase.auth.admin.create_user({
                    "email": EMAIL,
                    "password": PASSWORD,
                    "email_confirm": True,
                    "user_metadata": {"role": "atollom_admin"}
                })
                user_id = user_resp.user.id
                print(f"Usuario creado: {user_id}")

            supabase.table("user_profiles").upsert({
                "id": user_id,
                "email": EMAIL,
                "role": "atollom_admin",
                "tenant_id": TENANT_ID
            }).execute()
            print("Perfil actualizado.")
            print("\nOK: Administrador configurado.")
            return
            
        except Exception as e:
            print(f"Falla intento {attempt + 1}: {e}")
            if attempt < 2:
                print("Reintentando en 3 segundos...")
                time.sleep(3)
            else:
                print("Todos los intentos fallaron.")

if __name__ == "__main__":
    setup_admin()

