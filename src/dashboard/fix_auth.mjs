import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://smgxbqkfxqbnmytalpos.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZ3hicWtmeHFibm15dGFscG9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk0Nzk1MywiZXhwIjoyMDkxNTIzOTUzfQ.mCe1LmWo6429Jbg-79ac0FJo8zYpUAIjZsr8wUPd5lw'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const users = [
  { 
    id: 'b23b51b6-4202-47c9-8ced-b840aa2e4ed9', 
    email: 'contacto@atollom.com', 
    password: 'Atollom2026', 
    metadata: { full_name: 'Atollom Admin' } 
  },
  { 
    id: '550e8400-e29b-41d4-a716-446655440001', 
    email: 'orthocardio@prueba.com', 
    password: 'Atollom', 
    metadata: { full_name: 'Ortho Owner' } 
  }
]

async function recreate() {
  console.log('--- Iniciando Recreación Oficial vía Admin API ---')
  
  for (const user of users) {
    console.log(`Creando ${user.email}...`)
    
    const { data, error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      user_metadata: user.metadata,
      email_confirm: true
    })

    if (error) {
      console.error(`Error creando ${user.email}:`, error.message)
    } else {
      console.log(`✅ ${user.email} creado con éxito. UID: ${data.user.id}`)
    }
  }
  
  console.log('--- Proceso Finalizado ---')
}

recreate()
