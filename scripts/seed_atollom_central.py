"""
Seed para Atollom Central - Centro de Operaciones
Incluye:
1. 10 Clientes Kinexis (Leads)
2. 20 Tickets de Soporte
3. 5 Conversaciones de WhatsApp (Mensajes + Sesiones)
"""
import os
import random
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client


load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Reintento de conexión por problemas de DNS
supabase = None
for i in range(5):
    try:
        supabase = create_client(url, key)
        # Test connection
        supabase.table("tenants").select("id").limit(1).execute()
        print(f"Conexión exitosa a Supabase (Intento {i+1})")
        break
    except Exception as e:
        print(f"Fallo de conexión (Intento {i+1}): {e}")
        time.sleep(2)

if not supabase:
    print("No se pudo conectar a Supabase después de 5 intentos.")
    exit(1)


# ID Real de Atollom Central detectado en DB
ATOLLOM_TENANT_ID = "40446806-0107-6201-9311-000000000001"

def get_now_cdmx():
    tz_mx = timezone(timedelta(hours=-6))
    return datetime.now(tz_mx)

def seed_leads():
    print("--- 1. Creando Leads (Clientes Kinexis) ---")
    empresas = [
        "Orthocardio Medical", "TechFlow Solutions", "Comercial Del Norte",
        "AutoParts México", "Fashion Boutique", "RestaurantePro",
        "FarmaSalud", "ElectroTech", "Construcciones Pérez", "Joyería Diamante"
    ]
    leads = []
    for empresa in empresas:
        leads.append({
            "tenant_id": ATOLLOM_TENANT_ID,
            "name": f"Director {empresa}",
            "email": f"contacto@{empresa.lower().replace(' ', '')}.com",
            "phone": f"+52155{random.randint(1000000, 9999999)}",
            "company": empresa,
            "type": "b2b",
            "score": random.randint(60, 100),
            "deal_stage": random.choice(["new", "contacted", "qualified", "customer"]),
            "source": random.choice(["facebook", "cold_call", "referral", "web"])
        })

    
    # Limpieza previa de leads de Atollom
    supabase.table("leads").delete().eq("tenant_id", ATOLLOM_TENANT_ID).execute()
    result = supabase.table("leads").insert(leads).execute()
    print(f"OK: {len(result.data)} leads insertados")

def seed_tickets():
    print("\n--- 2. Creando Tickets de Soporte ---")
    tickets = []
    issues = [
        ("Error deploy", "Cliente reporta error 500 al intentar desplegar"),
        ("Consulta API", "Duda sobre el endpoint de inventario"),
        ("Configuración ML", "Problema vinculando cuenta de Mercado Libre"),
        ("Problema CFDI", "Factura no se genera correctamente"),
        ("WhatsApp Downtime", "Agente no responde mensajes"),
        ("Error de Stock", "Sincronización de inventario fallida")
    ]
    
    for i in range(1, 21):
        issue = random.choice(issues)
        title, desc = issue
        tickets.append({
            "tenant_id": ATOLLOM_TENANT_ID,
            "customer_contact": f"+52155{random.randint(1000000, 9999999)}",
            "issue_type": title,
            "description": desc,
            "status": random.choice(["open", "resolved", "in_progress", "closed"]),
            "priority": random.choice(["low", "medium", "high", "critical"]),

            "created_at": (get_now_cdmx() - timedelta(days=random.randint(0, 7))).isoformat()
        })

    
    # Limpieza previa
    supabase.table("support_tickets").delete().eq("tenant_id", ATOLLOM_TENANT_ID).execute()
    result = supabase.table("support_tickets").insert(tickets).execute()
    print(f"OK: {len(result.data)} tickets de soporte insertados")

def seed_whatsapp():
    print("\n--- 3. Creando WhatsApp Conversations ---")
    chats = [
        ("+5215512345678", "Orthocardio", [
            "Hola, necesito una cotización de 50 stents.",
            "Enseguida te atendemos. ¿Para qué hospital?",
            "Para el Hospital Central."
        ]),
        ("+5215587654321", "TechFlow", [
            "¿Cuándo llega mi pedido de laptops?",
            "Está en tránsito. Debería llegar mañana.",
            "Gracias por la información."
        ]),
        ("+5215555555555", "Comercial Del Norte", [
            "Tengo problemas con la factura A-123",
            "Lamentamos el inconveniente. ¿Cuál es el error?",
            "El RFC está mal capturado."
        ]),
        ("+5215544444444", "AutoParts México", [
            "¿Tienen stock de frenos ABS?",
            "Sí, contamos con 20 unidades disponibles.",
            "Perfecto, mándame 10."
        ]),
        ("+5215566666666", "Fashion Boutique", [
            "Me gustaría probar el módulo ERP",
            "Claro, podemos agendar una demo hoy a las 4pm.",
            "Me parece bien, nos vemos."
        ])
    ]
    
    # Limpieza previa
    supabase.table("whatsapp_messages").delete().eq("tenant_id", ATOLLOM_TENANT_ID).execute()
    supabase.table("whatsapp_sessions").delete().eq("tenant_id", ATOLLOM_TENANT_ID).execute()
    
    msg_count = 0
    for phone, name, msgs in chats:
        # Crear sesión
        supabase.table("whatsapp_sessions").insert({
            "tenant_id": ATOLLOM_TENANT_ID,
            "from_number": phone,
            "session_type": "active_chat",
            "state": {"customer_name": name, "samantha_active": True}
        }).execute()
        
        # Crear mensajes
        for i, text in enumerate(msgs):
            direction = "inbound" if i % 2 == 0 else "outbound"
            supabase.table("whatsapp_messages").insert({
                "tenant_id": ATOLLOM_TENANT_ID,
                "from_number": phone if direction == "inbound" else "system",
                "to_number": "system" if direction == "inbound" else phone,
                "direction": direction,
                "message_text": text,
                "processed": True,
                "status": "received" if direction == "inbound" else "sent",
                "created_at": (get_now_cdmx() - timedelta(minutes=random.randint(10, 1440))).isoformat()
            }).execute()
            msg_count += 1

            
    print(f"OK: 5 conversaciones ({msg_count} mensajes) creadas")

if __name__ == "__main__":
    try:
        seed_leads()
        seed_tickets()
        seed_whatsapp()
        print("\n🎉 Seed de Atollom Central completado con éxito.")
    except Exception as e:
        print(f"Error durante el seed: {e}")
