import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://smgxbqkfxqbnmytalpos.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZ3hicWtmeHFibm15dGFscG9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk0Nzk1MywiZXhwIjoyMDkxNTIzOTUzfQ.mCe1LmWo6429Jbg-79ac0FJo8zYpUAIjZsr8wUPd5lw'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listUsers() {
  console.log('--- Listando Usuarios del Proyecto ---')
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error listando usuarios:', error.message)
    return
  }
  
  users.forEach(u => {
    console.log(`- ${u.email} (ID: ${u.id})`)
  })
}

listUsers()
