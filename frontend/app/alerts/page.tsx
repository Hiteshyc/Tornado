'use client'

import { useState } from 'react'
import { ArrowLeft, MapPin, Clock, AlertTriangle, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Severity } from '../types'
import { SEVERITY_HEX, SEVERITY_LABEL } from '../types'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

// ── Severity badge ──────────────────────────────────────────
function SevBadge({ severity }: { severity: Severity }) {
  const color = SEVERITY_HEX[severity]
  const label = SEVERITY_LABEL[severity]
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase"
      style={{ background: color + '18', color, border: `1px solid ${color}30`, fontFamily: 'var(--font-mono)' }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

export default function AlertsPage() {
  const router = useRouter()
  const { alerts } = useData()
  const { user, isLoading } = useAuth()
  const [filter, setFilter] = useState<Severity | 'all'>('all')

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'officer')) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== 'officer') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <div className="text-sm font-mono opacity-50">Checking access...</div>
      </div>
    )
  }

  const severities: Array<Severity | 'all'> = ['all', 'critical', 'high', 'moderate', 'low', 'safe']

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter)

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* ── Page header ─────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-3 px-6 py-4 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}
      >
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'var(--fg-muted)', border: '1px solid var(--border)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-widest font-mono mb-0.5" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
            Tornado · Alert Centre
          </div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>
            Active Alerts
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full anim-blink" style={{ background: '#dc2626' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
            {alerts.length} ACTIVE
          </span>
        </div>
      </header>

      {/* ── Filter pills ─────────────────────────────────────── */}
      <div
        className="shrink-0 px-6 py-3 flex gap-2 overflow-x-auto border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}
      >
        {severities.map(s => {
          const active = filter === s
          const color = s === 'all' ? 'var(--primary)' : SEVERITY_HEX[s]
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="shrink-0 px-3 py-1 rounded-full text-[10px] font-mono capitalize transition-all duration-150"
              style={{
                background: active ? color + '22' : 'transparent',
                color: active ? color : 'var(--fg-muted)',
                border: `1px solid ${active ? color + '44' : 'var(--border)'}`,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {s === 'all' ? `All (${alerts.length})` : SEVERITY_LABEL[s]}
            </button>
          )
        })}
      </div>

      {/* ── Alert list ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="text-4xl">✅</div>
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>No alerts for this severity level.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {filtered.map((alert, i) => {
              const color = SEVERITY_HEX[alert.severity]
              return (
                <div
                  key={alert.id}
                  className="rounded-2xl p-4 anim-stagger-in"
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${color}25`,
                    borderLeft: `4px solid ${color}`,
                    boxShadow: 'var(--shadow)',
                    animationDelay: `${i * 0.06}s`,
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} style={{ color }} className="shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                        {alert.title}
                      </span>
                    </div>
                    <SevBadge severity={alert.severity} />
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-[10px] font-mono mb-2.5" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span className="flex items-center gap-1">
                      <MapPin size={9} /> {alert.locationName || (typeof alert.location === 'string' ? alert.location : '')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={9} /> Expected in {alert.expectedHours}h
                    </span>
                    <span>{alert.timestamp}</span>
                  </div>

                  {/* Action */}
                  <div
                    className="text-xs px-3 py-2 rounded-lg mb-3"
                    style={{ background: color + '10', color, border: `1px solid ${color}20` }}
                  >
                    ⚡ {alert.action}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end">
                    <button
                      className="flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full transition-all"
                      style={{ color: 'var(--primary)', border: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <ExternalLink size={10} /> View on Map
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
