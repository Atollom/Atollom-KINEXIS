import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://smgxbqkfxqbnmytalpos.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZ3hicWtmeHFibm15dGFscG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDc5NTMsImV4cCI6MjA5MTUyMzk1M30.WIEeaU-UE-9nYV0WFtVXD4hM_BVzVGpHBiMmGbmrjfE'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

const TESTS = [
  { email: 'contacto@atollom.com', password: 'Atollom2026', expectedRole: 'atollom_admin' },
  { email: 'orthocardio@prueba.com', password: 'Atollom', expectedRole: 'owner' },
]

async function verify() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' VERIFICACIÓN POST-FIX RLS RECURSION')
  console.log('═══════════════════════════════════════════════════════\n')

  let allPassed = true

  for (const test of TESTS) {
    console.log(`── Probando: ${test.email} ──`)

    // 1. Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: test.email,
      password: test.password
    })

    if (authError) {
      console.error(`  ❌ Login falló: ${authError.message}`)
      allPassed = false
      continue
    }
    console.log(`  ✅ Login OK (uid: ${authData.user.id})`)

    // 2. Leer user_profiles (esto era lo que causaba Error 500)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tenant_id, role, full_name')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error(`  ❌ user_profiles FALLO: ${profileError.message} (code: ${profileError.code})`)
      allPassed = false
    } else {
      console.log(`  ✅ user_profiles OK — role: ${profile.role}, tenant: ${profile.tenant_id}`)

      if (profile.role !== test.expectedRole) {
        console.warn(`  ⚠️  Rol esperado: ${test.expectedRole}, obtenido: ${profile.role}`)
      }
    }

    // 3. Leer tenant_profiles
    const { data: tenantProfile, error: tpError } = await supabase
      .from('tenant_profiles')
      .select('business_name, plan')
      .limit(1)

    if (tpError) {
      console.error(`  ❌ tenant_profiles FALLO: ${tpError.message}`)
      allPassed = false
    } else {
      console.log(`  ✅ tenant_profiles OK — ${tenantProfile?.length || 0} registros`)
    }

    // 4. Leer tenants
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .limit(1)

    if (tenantError) {
      console.error(`  ❌ tenants FALLO: ${tenantError.message}`)
      allPassed = false
    } else {
      console.log(`  ✅ tenants OK — ${tenantData?.length || 0} registros`)
    }

    // 5. Logout
    await supabase.auth.signOut()
    console.log('')
  }

  console.log('═══════════════════════════════════════════════════════')
  console.log(allPassed ? '  🎉 TODAS LAS PRUEBAS PASARON' : '  ❌ HAY FALLOS — revisar arriba')
  console.log('═══════════════════════════════════════════════════════')
}

verify()
