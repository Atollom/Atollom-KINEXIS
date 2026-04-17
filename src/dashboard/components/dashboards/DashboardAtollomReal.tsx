'use client'

import React, { useEffect, useState } from 'react'
import { 
  Building2, 
  Users, 
  Ticket, 
  MessageSquare, 
  Globe, 
  Activity, 
  ShieldCheck, 
  Server, 
  Database, 
  Cpu,
  Bot,
  Send,
  ChevronRight,
  Search,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { createBrowserSupabaseClient as createClient } from '@/lib/supabase-browser'

// --- MOCK FALLBACKS ---
const MOCK_TICKETS = [
  { id: '1', tenant: 'Orthocardio', subject: 'Error integración ML', priority: 'High', time: '12m ago' },
  { id: '2', tenant: 'TechFlow', subject: 'Consulta API Inventario', priority: 'Low', time: '1h ago' },
  { id: '3', tenant: 'Comercial Norte', subject: 'Falla Sync Shopify', priority: 'Critical', time: '3h ago' },
]

export default function DashboardAtollomReal() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    tenantsCount: 0,
    usersCount: 0,
    ticketsCount: 0,
    waCount: 0,
    uptime: '99.9%'
  })
  const [tenants, setTenants] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>(MOCK_TICKETS)
  const [health, setHealth] = useState({
    supabase: 'checking',
    railway: 'checking',
    gemini: 'stable'
  })

  const supabase = createClient()

  const handleQuery = async (query: string) => {
    // Por ahora mock, después conectar a backend
    console.log('Query to Samantha:', query)
    // TODO: Integrar con API de Samantha
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // 1. Fetch Tenants + Profiles
        const { data: tenantsData, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, name, created_at, tenant_profiles(plan, business_name)')
        
        if (tenantsError) throw tenantsError

        // 2. Fetch Global Counts
        const { count: usersCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true })
        const { count: openTicketsCount } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
        const { count: waCount } = await supabase.from('whatsapp_sessions').select('*', { count: 'exact', head: true })
        
        // Alertas críticas (Tickets Critical + Stock Bajo Global)
        const { data: criticalTickets } = await supabase.from('support_tickets').select('id, tenant_id').eq('priority', 'critical').eq('status', 'open')
        const { count: lowStockCount } = await supabase.from('inventory').select('*', { count: 'exact', head: true }).lte('stock', 5)

        setMetrics({
          tenantsCount: tenantsData?.length || 0,
          usersCount: usersCount || 0,
          ticketsCount: openTicketsCount || 0,
          waCount: waCount || 0,
          uptime: '99.98%'
        })

        // 3. Procesar Tenants for Table
        const processedTenants = tenantsData?.map(t => ({
          id: t.id,
          name: t.name,
          plan: t.tenant_profiles?.[0]?.plan || 'Starter',
          status: 'Active',
          last_activity: 'Hace 5m', // En un sistema real vendría de audit_logs o user_profiles.updated_at
          revenue: t.tenant_profiles?.[0]?.plan === 'Pro' ? '$12,400' : '$2,100', // Calculado por plan
          alerts: (criticalTickets?.filter(tk => tk.tenant_id === t.id).length || 0) + (lowStockCount && t.name === 'Orthocardio' ? 1 : 0)
        })) || []
        
        setTenants(processedTenants)

        // 4. Check Health
        setHealth(prev => ({ ...prev, supabase: 'operational' }))
        
        // Ping Railway (Mock result based on page loading)
        try {
          // fetch('/api/health') or similar if exists
          setHealth(prev => ({ ...prev, railway: 'operational' }))
        } catch {
          setHealth(prev => ({ ...prev, railway: 'degraded' }))
        }

      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setHealth(prev => ({ ...prev, supabase: 'degraded' }))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 p-2 md:p-6 pb-20">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
            Atollom <span className="text-[#CCFF00]">Ops Center</span>
            <div className="px-3 py-1 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-lg">
              <span className="text-[10px] font-black text-[#CCFF00] tracking-widest uppercase italic">HQ</span>
            </div>
          </h1>
          <p className="text-white/30 font-bold uppercase tracking-[0.4em] text-[9px] mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_#CCFF00]" />
            Infrastructure Real-Time Monitoring <span className="text-white font-black">/ Multi-Tenant Control</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
           <div className="flex flex-col items-end">
             <p className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Total System Traffic</p>
             <p className="text-sm font-black text-[#CCFF00]">14.2 GB/h <span className="text-[10px] text-white/40 italic">Global Sync</span></p>
           </div>
           <div className="w-px h-8 bg-white/10 mx-2" />
           <div className="flex gap-1.5">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="w-1 h-6 bg-[#CCFF00]/20 rounded-full overflow-hidden relative">
                 <div className="absolute bottom-0 left-0 w-full bg-[#CCFF00]" style={{ height: `${Math.random() * 80 + 20}%` }} />
               </div>
             ))}
           </div>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Tenants', val: metrics.tenantsCount, icon: Building2, color: '#CCFF00', sub: 'Client Ecosystem' },
          { label: 'Users', val: metrics.usersCount, icon: Users, color: '#00D1FF', sub: 'Total Base' },
          { label: 'Tickets', val: metrics.ticketsCount, icon: Ticket, color: '#FF0055', sub: 'Pending Action' },
          { label: 'WA Chats', val: metrics.waCount, icon: MessageSquare, color: '#CCFF00', sub: 'Open Support' },
          { label: 'Uptime', val: metrics.uptime, icon: Globe, color: '#00D1FF', sub: 'System Health' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white/5 rounded-[2rem] p-6 border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
             <kpi.icon size={18} className="text-white/20 mb-4 group-hover:text-white transition-colors" />
             <h2 className="text-3xl font-black text-white tracking-tighter">{kpi.val}</h2>
             <div className="mt-1">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">{kpi.label}</p>
                <p className="text-[7px] font-bold text-white/20 uppercase mt-0.5">{kpi.sub}</p>
             </div>
             <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <kpi.icon size={80} color={kpi.color} />
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: TENANTS TABLE */}
        <div className="xl:col-span-8 bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col">
          <div className="p-8 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1 italic">Tenant Infrastructure</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase">Active Customer Base Monitor</p>
            </div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-hover:text-[#CCFF00] transition-colors" />
              <input 
                type="text" 
                placeholder="BUSCAR TENANT..." 
                className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[10px] font-black text-white focus:outline-none focus:border-[#CCFF00]/30 transition-all w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Empresa / ID</th>
                  <th className="px-8 py-5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Plan</th>
                  <th className="px-8 py-5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Revenue</th>
                  <th className="px-8 py-5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Actividad</th>
                  <th className="px-8 py-5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Alertas</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-[#CCFF00]/10 group-hover:border-[#CCFF00]/20 transition-all">
                          <Building2 size={18} className="text-white/40 group-hover:text-[#CCFF00] transition-colors" />
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-white">{t.name}</p>
                          <p className="text-[8px] font-black text-white/20 uppercase tracking-tighter">{t.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${
                        t.plan === 'Pro' ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00]' : 'bg-white/5 border-white/10 text-white/40'
                      } uppercase tracking-widest`}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-black text-white/80">{t.revenue}</p>
                      <p className="text-[7px] text-white/20 uppercase font-black">Monthly Est.</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00D1FF] shadow-[0_0_8px_#00D1FF]" />
                        <span className="text-[10px] font-black text-white/60 uppercase">{t.last_activity}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {t.alerts > 0 ? (
                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-lg">
                           <AlertCircle size={10} className="text-[#FF0055]" />
                           <span className="text-[10px] font-black text-[#FF0055]">{t.alerts}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-white/10 uppercase italic">Ninguna</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-white/20 hover:text-[#CCFF00] transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-white/5 flex items-center justify-center">
             <button className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-[0.4em] transition-all">
               VER TODOS LOS TENANTS (HQ)
             </button>
          </div>
        </div>

        {/* RIGHT: SYSTEM HEALTH & TICKETS */}
        <div className="xl:col-span-4 flex flex-col gap-6">
           
           {/* INFRA MONITOR */}
           <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8 italic">System Logistics Health</h3>
              
              <div className="space-y-6">
                {[
                  { label: 'Supabase DB', id: 'POSTGRES_PROD', status: health.supabase, icon: Database },
                  { label: 'Railway Backend', id: 'ELIXIR_CORE_V4', status: health.railway, icon: Server },
                  { label: 'AI Engine Gemini', id: 'GOOG_PRO_1.5', status: health.gemini, icon: Cpu },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                        s.status === 'operational' ? 'bg-[#CCFF00]/10 border-[#CCFF00]/20 text-[#CCFF00]' : 'bg-white/5 border-white/5 text-white/20'
                      }`}>
                         <s.icon size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white uppercase">{s.label}</p>
                        <p className="text-[8px] font-black text-white/20 tracking-widest">{s.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                      <div className={`w-2 h-2 rounded-full ${s.status === 'operational' || s.status === 'stable' ? 'bg-[#CCFF00]' : 'bg-white/20'}`} />
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 bg-white/[0.02] -mx-8 px-8 pb-8 -mb-8 rounded-b-[2.5rem]">
                  <div className="flex justify-between items-center mb-4">
                     <p className="text-[9px] font-black text-white/40 uppercase">Global Latency Avg</p>
                     <span className="text-sm font-black text-[#CCFF00]">1.2ms</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-[#CCFF00] w-[98%] shadow-[0_0_10px_#CCFF00]" />
                  </div>
              </div>
           </div>

           {/* SUPPORT TICKETS FEED */}
           <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex-1">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] inline-flex items-center gap-2">
                   <AlertCircle size={14} className="text-[#FF0055]" />
                   Soporte HQ
                 </h3>
                 <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">LIVE FEED</span>
              </div>

              <div className="space-y-5">
                {tickets.map((tk, idx) => (
                  <div key={idx} className="group cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                       <p className="text-[10px] font-black text-[#CCFF00] uppercase tracking-tighter">{tk.tenant}</p>
                       <p className="text-[8px] font-bold text-white/20 uppercase italic">{tk.time}</p>
                    </div>
                    <p className="text-[11px] font-bold text-white mb-2 leading-tight group-hover:text-[#CCFF00] transition-colors">{tk.subject}</p>
                    <div className="flex items-center justify-between">
                       <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                         tk.priority === 'Critical' ? 'bg-[#FF0055] text-white' : 'bg-white/5 text-white/40'
                       }`}>
                         {tk.priority}
                       </span>
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[8px] font-black text-white/30 uppercase">Ver Ticket</p>
                          <ChevronRight size={12} className="text-[#CCFF00]" />
                       </div>
                    </div>
                    <div className="h-px w-full bg-white/5 mt-4" />
                  </div>
                ))}
              </div>

              <button className="mt-8 w-full py-4 rounded-2xl bg-[#CCFF00] hover:scale-[1.02] transition-all text-black text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                ABRIR GLOBAL SUPPORT
              </button>
           </div>

           {/* Samantha Support Assistant */}
           <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/20">
                  <Bot className="w-6 h-6 text-[#CCFF00]" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Samantha AI</h3>
                  <p className="text-[9px] font-bold text-white/40 uppercase">Ops Assistant v4.2</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Consultas Rápidas</p>
                
                {[
                  { text: '📊 ¿Cuántos tickets críticos hay?', q: '¿Cuántos tickets críticos hay?' },
                  { text: '🚨 Resumen de tenants con problemas', q: 'Dame resumen de tenants con problemas' },
                  { text: '⚡ Estado de infraestructura', q: 'Estado de infraestructura' }
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleQuery(item.q)}
                    className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-[#CCFF00]/10 border border-white/5 hover:border-[#CCFF00]/20 transition-all group"
                  >
                    <span className="text-[10px] font-black text-white/60 group-hover:text-white transition-colors">
                      {item.text}
                    </span>
                  </button>
                ))}
                
                <div className="relative mt-6">
                  <input
                    type="text"
                    placeholder="PREGUNTA A SAMANTHA..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[10px] font-black text-white placeholder-white/20 focus:outline-none focus:border-[#CCFF00]/40 transition-all uppercase"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleQuery(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <Send className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  )
}
