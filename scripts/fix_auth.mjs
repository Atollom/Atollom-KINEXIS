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
  { id: 'b23b51b6-4202-47c9-8ced-b840aa2e4ed9', email: 'contacto@atollom.com', password: 'Atollom2026' },
  { id: '550e8400-e29b-41d4-a716-446655440001', email: 'orthocardio@prueba.com', password: 'Atollom' }
]

async function repair() {
  console.log('--- Iniciando Reparación Oficial vía Admin API ---')
  
  for (const user of users) {
    console.log(`Reparando ${user.email}...`)
    
    // 1. Actualizar usuario (Password + Confirmación de Email)
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        password: user.password,
        email_confirm: true 
      }
    )

    if (error) {
      console.error(`Error reparando ${user.email}:`, error.message)
    } else {
      console.log(`✅ ${user.email} reparado con éxito.`)
    }
  }
  
  console.log('--- Fin del proceso ---')
}

repair()
