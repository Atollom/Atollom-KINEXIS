"""
Test de RBAC - Verificar qué ve cada rol
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

# Test queries por rol
# NOTA: Usando SERVICE_ROLE_KEY se bypassan todas las RLS policies.
# Para un test real, se requeriría iniciar sesión con cada usuario.
roles = ["owner", "admin", "almacenista", "vendedor", "contador"]

for role in roles:
    print(f"\n=== ROL: {role.upper()} ===")
    
    # Simular query de productos
    try:
        result = supabase.table("products").select("*").limit(5).execute()
        print(f"OK: Ve {len(result.data)} productos")
    except Exception as e:
        print(f"Error: {e}")
    
    # Simular query de órdenes con montos
    try:
        result = supabase.table("orders").select("total").limit(5).execute()
        print(f"OK: Ve montos de órdenes: {bool(result.data)}")
    except Exception as e:
        print(f"No puede ver montos: {e}")

print("\n(Simulacion) Test de RBAC completado.")
print("NOTA: Este test se ejecuta con SERVICE_ROLE_KEY (Superusuario).")
print("Para probar RLS real, se debe usar el JWT de cada rol/usuario específico.")
