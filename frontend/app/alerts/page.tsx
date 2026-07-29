'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Clock, Wind, Users, Bot, Truck, ArrowLeft } from 'lucide-react'
import { officerAlerts, type OfficerAlert } from '../data/officerData'
import type { Severity } from '../types'
import { SEVERITY_HEX, SEVERITY_LABEL } from '../types'
import { useAuth } from '../context/AuthContext'

const SEV_OPTS: Array<Severity | 'all'> = ['all', 'critical', 'high', 'moderate', 'low']
const TYPE_OPTS = ['All Types', 'Cyclone', 'Storm Surge', 'Flood', 'High Tide', 'Tsunami', 'Lightning']
const DIST_OPTS = ['All Districts', 'North Goa', 'South Goa', 'Sindhudurg', 'Ratnagiri']

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="p-4 rounded-xl border anim-fade-up"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderLeft: `3px solid ${color}` }}
    >
      <div className="text-2xl font-mono font-semibold" style={{ color }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--fg-muted)' }}>{label}</div>
    </div>
  )
}

function AlertCard({ alert, index, onDeploy }: {
  alert: OfficerAlert; index: number; onDeploy: (a: OfficerAlert) => void
}) {
  const color = SEVERITY_HEX[alert.severity]
  const label = SEVERITY_LABEL[alert.severity]

  return (
    <div
      className="rounded-xl border overflow-hidden anim-stagger-in"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        borderLeft: `3px solid ${color}`,
        animationDelay: `${index * 0.06}s`,
      }}
    >
      {/* Card header */}
      <div
        className="flex items-start justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: color + '08' }}
      >
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
            🚨 {alert.title}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono" style={{ color: 'var(--fg-muted)' }}>
            <MapPin size={9} /> {alert.location}
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <Clock size={9} /> {alert.timestamp}
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase shrink-0"
          style={{ background: color + '18', color, border: `1px solid ${color}30` }}
        >
          <span className="w-1.5 h-1.5 rounded-full anim-blink" style={{ background: color }} />
          {label}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0" style={{ borderColor: 'var(--border)' }}>
        <InfoCell icon={MapPin} label="Location" value={alert.district} />
        <InfoCell icon={Bot} label="AI Confidence" value={`${alert.aiConfidence}%`} />
        <InfoCell icon={Wind} label="Wind Speed" value={`${alert.windSpeed} km/h`} warn={alert.windSpeed > 80} />
        <InfoCell icon={Users} label="Population" value={`${(alert.population / 1000).toFixed(0)}k`} />
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--fg-muted)' }}>
          <Truck size={10} />
          {alert.deployedTeams > 0
            ? <span style={{ color: '#16a34a' }}>{alert.deployedTeams} team{alert.deployedTeams > 1 ? 's' : ''} deployed</span>
            : <span style={{ color: '#dc2626' }}>No teams deployed</span>
          }
        </div>
        <button
          onClick={() => onDeploy(alert)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{ background: color, color: '#fff' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Truck size={12} />
          Deploy Team
        </button>
      </div>
    </div>
  )
}

function InfoCell({ icon: Icon, label, value, warn }: {
  icon: React.ElementType; label: string; value: string; warn?: boolean
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
      <Icon size={12} style={{ color: warn ? '#dc2626' : 'var(--fg-muted)' }} className="shrink-0" />
      <div>
        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>{label}</div>
        <div className="text-xs font-mono font-medium mt-0.5" style={{ color: warn ? '#dc2626' : 'var(--fg)' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

// ── Deploy confirmation modal ───────────────────────────────
function DeployModal({ alert, onClose, onConfirm }: {
  alert: OfficerAlert
  onClose: () => void
  onConfirm: () => void
}) {
  const color = SEVERITY_HEX[alert.severity]
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 anim-backdrop"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden anim-scale-up"
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${color}`,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: color + '0c' }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
            Deploy Team — {alert.title}
          </div>
          <div className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--fg-muted)' }}>
            {alert.location}
          </div>
        </div>
        <div className="px-5 py-4 text-sm" style={{ color: 'var(--fg-muted)' }}>
          You will be redirected to the <span style={{ color: 'var(--fg)', fontWeight: 500 }}>Deployments</span> workspace
          to assign and manage teams for this operation.
        </div>
        <div className="flex gap-2 px-5 pb-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-xs border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >Cancel</button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-xs font-semibold"
            style={{ background: color, color: '#fff' }}
          >Go to Deployments →</button>
        </div>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [search, setSearch]       = useState('')
  const [sevFilter, setSevFilter] = useState<Severity | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [distFilter, setDistFilter] = useState('All Districts')
  const [deployTarget, setDeployTarget] = useState<OfficerAlert | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'officer' && user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, isLoading, router])

  const stats = useMemo(() => ({
    active:   officerAlerts.length,
    critical: officerAlerts.filter(a => a.severity === 'critical').length,
    moderate: officerAlerts.filter(a => a.severity === 'moderate').length,
    advisory: officerAlerts.filter(a => a.severity === 'low' || a.severity === 'safe').length,
  }), [])

  const filtered = useMemo(() => officerAlerts.filter(a => {
    const q = search.toLowerCase()
    if (q && !a.title.toLowerCase().includes(q) && !a.location.toLowerCase().includes(q)) return false
    if (sevFilter !== 'all' && a.severity !== sevFilter) return false
    if (typeFilter !== 'All Types' && a.alertType !== typeFilter) return false
    if (distFilter !== 'All Districts' && a.district !== distFilter) return false
    return true
  }), [search, sevFilter, typeFilter, distFilter])

  if (isLoading || !user || (user.role !== 'officer' && user.role !== 'admin')) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <div className="text-sm font-mono opacity-50">Checking access...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--nav-h))] overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-3 border-b rounded-t-xl"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: 'var(--fg-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Active Alerts</div>
            <div className="text-[10px] font-mono" style={{ color: 'var(--fg-muted)' }}>
              Officer jurisdiction · Action: Deploy Team
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono"
          style={{ background: '#dc262610', border: '1px solid #dc262620', color: '#dc2626' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 anim-blink" />
          {stats.critical} Critical
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 rounded-b-xl border-x border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Active Alerts" value={stats.active}   color="var(--primary)" />
          <StatCard label="Critical"       value={stats.critical} color="#9333ea" />
          <StatCard label="Moderate"       value={stats.moderate} color="#ea580c" />
          <StatCard label="Advisory"       value={stats.advisory} color="#ca8a04" />
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap items-center gap-2 p-3 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 min-w-40"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
          >
            <Search size={13} style={{ color: 'var(--fg-muted)' }} />
            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          {/* Severity pills */}
          <div className="flex gap-1">
            {SEV_OPTS.map(s => {
              const active = sevFilter === s
              const c = s === 'all' ? 'var(--primary)' : SEVERITY_HEX[s]
              return (
                <button
                  key={s}
                  onClick={() => setSevFilter(s)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-mono capitalize transition-all"
                  style={{
                    background: active ? c + '22' : 'transparent',
                    color: active ? c : 'var(--fg-muted)',
                    border: `1px solid ${active ? c + '44' : 'var(--border)'}`,
                  }}
                >
                  {s === 'all' ? 'All' : SEVERITY_LABEL[s]}
                </button>
              )
            })}
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
          >
            {TYPE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select
            value={distFilter}
            onChange={e => setDistFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
          >
            {DIST_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Alert cards */}
        <div className="space-y-3 pb-10">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--fg-muted)' }}>
              No alerts match your filters.
            </div>
          ) : (
            filtered.map((a, i) => (
              <AlertCard
                key={a.id}
                alert={a}
                index={i}
                onDeploy={setDeployTarget}
              />
            ))
          )}
        </div>
      </div>

      {deployTarget && (
        <DeployModal
          alert={deployTarget}
          onClose={() => setDeployTarget(null)}
          onConfirm={() => {
            const id = deployTarget.id
            setDeployTarget(null)
            router.push(`/deployments?alertId=${id}`)
          }}
        />
      )}
    </div>
  )
}
