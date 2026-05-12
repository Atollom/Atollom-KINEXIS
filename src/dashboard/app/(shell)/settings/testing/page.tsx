'use client'

import { useState, useRef } from 'react'
import { authenticatedFetch } from '@/lib/api-client'
import { useToast } from '@/components/ToastProvider'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  ms: number
  timestamp: string
}

type RunState = string | null  // test name currently running, or null

const TEST_SUITE: Record<string, () => Promise<{ detail: string }>> = {
  'Sandbox Status': async () => {
    const res = await authenticatedFetch('/api/sandbox/status')
    const d = await res.json()
    if (!d.mode) throw new Error('No mode field in response')
    return { detail: `mode=${d.mode} · ${Object.keys(d.integrations ?? {}).length} integrations` }
  },
  'ML Sync': async () => {
    const res = await authenticatedFetch('/api/sandbox/sync/mercadolibre', { method: 'POST' })
    const d = await res.json()
    if (!d.success) throw new Error(d.error ?? 'sync failed')
    return { detail: `${d.items_synced} items synced` }
  },
  'Amazon Sync': async () => {
    const res = await authenticatedFetch('/api/sandbox/sync/amazon', { method: 'POST' })
    const d = await res.json()
    if (!d.success) throw new Error(d.error ?? 'sync failed')
    return { detail: `${d.items_synced} items synced` }
  },
  'Shopify Sync': async () => {
    const res = await authenticatedFetch('/api/sandbox/sync/shopify', { method: 'POST' })
    const d = await res.json()
    if (!d.success) throw new Error(d.error ?? 'sync failed')
    return { detail: `${d.items_synced} items synced` }
  },
  'Meta Sync': async () => {
    const res = await authenticatedFetch('/api/sandbox/sync/meta', { method: 'POST' })
    const d = await res.json()
    if (!d.success) throw new Error(d.error ?? 'sync failed')
    return { detail: `${d.items_synced} items synced` }
  },
  'Database': async () => {
    const res = await authenticatedFetch('/api/health/db')
    const d = await res.json()
    if (!d.connected) throw new Error(d.error ?? 'not connected')
    return { detail: d.message ?? 'connected' }
  },
  'Samantha AI': async () => {
    const res = await authenticatedFetch('/api/health/samantha')
    const d = await res.json()
    if (d.status !== 'healthy') throw new Error('status=' + d.status)
    return { detail: d.message ?? 'operational' }
  },
}

const STATUS_CFG = {
  success: { dot: 'bg-[#CCFF00] shadow-[0_0_6px_#CCFF00]', badge: 'bg-[#CCFF00]/10 border-[#CCFF00]/20 text-[#CCFF00]', label: 'PASS' },
  error:   { dot: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]', badge: 'bg-red-500/10 border-red-500/20 text-red-400', label: 'FAIL' },
  warning: { dot: 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]', badge: 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400', label: 'WARN' },
}

export default function TestingPage() {
  const { showToast } = useToast()
  const [results, setResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState<RunState>(null)
  const [logs, setLogs] = useState<{ text: string; level: 'info' | 'ok' | 'err' }[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)

  function addLog(text: string, level: 'info' | 'ok' | 'err' = 'info') {
    setLogs(prev => [...prev.slice(-99), { text: `[${new Date().toLocaleTimeString()}] ${text}`, level }])
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function runTest(name: string, fn: () => Promise<{ detail: string }>) {
    setRunning(name)
    const t0 = Date.now()
    try {
      const { detail } = await fn()
      const ms = Date.now() - t0
      setResults(prev => [{ name, status: 'success', message: detail, ms, timestamp: new Date().toISOString() }, ...prev])
      addLog(`${name}: ${detail} (${ms}ms)`, 'ok')
      return true
    } catch (err: any) {
      const ms = Date.now() - t0
      const msg = err?.message ?? 'Unknown error'
      setResults(prev => [{ name, status: 'error', message: msg, ms, timestamp: new Date().toISOString() }, ...prev])
      addLog(`${name}: ${msg} (${ms}ms)`, 'err')
      return false
    } finally {
      setRunning(null)
    }
  }

  async function runAll() {
    setResults([])
    setLogs([])
    addLog('=== STARTING FULL TEST SUITE ===')
    let passed = 0
    for (const [name, fn] of Object.entries(TEST_SUITE)) {
      const ok = await runTest(name, fn)
      if (ok) passed++
      await new Promise(r => setTimeout(r, 300))
    }
    addLog(`=== COMPLETE: ${passed}/${Object.keys(TEST_SUITE).length} passed ===`)
    showToast({
      type: passed === Object.keys(TEST_SUITE).length ? 'success' : 'error',
      title: 'Test Suite',
      message: `${passed} / ${Object.keys(TEST_SUITE).length} tests passed`,
    })
  }

  const passed  = results.filter(r => r.status === 'success').length
  const failed  = results.filter(r => r.status === 'error').length
  const warned  = results.filter(r => r.status === 'warning').length

  return (
    <div className="min-h-screen p-6 space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="material-symbols-outlined !text-[26px] text-[#CCFF00]">biotech</span>
            <h1 className="tight-tracking text-2xl font-black text-white">Testing &amp; Validation</h1>
          </div>
          <p className="text-sm text-white/40">Suite de pruebas para sandbox, integraciones y servicios</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setResults([]); setLogs([]) }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-white/40 text-xs font-semibold hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined !text-[14px]">delete_sweep</span>
            Limpiar
          </button>
          <button
            onClick={runAll}
            disabled={!!running}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] text-xs font-black label-tracking hover:bg-[#CCFF00]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined !text-[16px] ${running ? 'animate-spin' : ''}`}>
              {running ? 'progress_activity' : 'play_arrow'}
            </span>
            {running ? `Running ${running}...` : 'RUN ALL TESTS'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'PASSED', value: passed, color: 'text-[#CCFF00]', bg: 'bg-[#CCFF00]/5 border-[#CCFF00]/10' },
            { label: 'FAILED', value: failed, color: 'text-red-400',   bg: 'bg-red-500/5 border-red-500/10' },
            { label: 'WARNED', value: warned, color: 'text-yellow-400',bg: 'bg-yellow-400/5 border-yellow-400/10' },
          ].map(s => (
            <div key={s.label} className={`glass-card p-4 ${s.bg} flex items-center justify-between`}>
              <span className={`text-[10px] font-black label-tracking ${s.color}`}>{s.label}</span>
              <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick test buttons */}
      <div>
        <p className="text-[10px] label-tracking text-white/30 mb-3">TESTS INDIVIDUALES</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(TEST_SUITE).map(([name, fn]) => {
            const last = results.find(r => r.name === name)
            const isRunning = running === name
            return (
              <button
                key={name}
                onClick={() => runTest(name, fn)}
                disabled={!!running}
                className="glass-card p-4 text-left group hover:border-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isRunning ? 'bg-[#CCFF00] animate-pulse' :
                    last ? STATUS_CFG[last.status].dot : 'bg-white/15'
                  }`} />
                  <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors truncate">{name}</span>
                </div>
                {last && (
                  <p className="text-[10px] text-white/30 truncate">{last.message}</p>
                )}
                {!last && !isRunning && (
                  <p className="text-[10px] text-white/20">Click to run</p>
                )}
                {isRunning && (
                  <p className="text-[10px] text-[#CCFF00]">Running...</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="glass-card">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <span className="material-symbols-outlined !text-[16px] text-white/40">assignment</span>
            <span className="text-xs font-bold text-white/60 label-tracking">RESULTADOS</span>
          </div>
          <div className="divide-y divide-white/5">
            {results.map((r, i) => {
              const cfg = STATUS_CFG[r.status]
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{r.name}</span>
                      <span className={`text-[9px] font-black label-tracking px-2 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 truncate">{r.message}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-mono text-white/30">{r.ms}ms</p>
                    <p className="text-[9px] text-white/20">{new Date(r.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Log terminal */}
      <div className="rounded-2xl bg-black/60 border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]/60" />
          </div>
          <span className="text-[10px] font-mono text-white/20">kinexis-test-runner</span>
          <span className="text-[10px] text-white/20">{logs.length} entries</span>
        </div>
        <div className="p-4 h-56 overflow-y-auto space-y-1 font-mono text-xs custom-scrollbar">
          {logs.length === 0 ? (
            <span className="text-white/20">$ waiting for test run...</span>
          ) : (
            logs.map((l, i) => (
              <div key={i} className={
                l.level === 'ok'  ? 'text-[#CCFF00]' :
                l.level === 'err' ? 'text-red-400' :
                'text-white/40'
              }>
                {l.text}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

    </div>
  )
}
