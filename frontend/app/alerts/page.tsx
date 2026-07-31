'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { io } from 'socket.io-client'
import { Search, MapPin, Clock, Wind, Users, Bot, Truck, ArrowLeft, CheckCircle } from 'lucide-react'
import type { Severity } from '../types'
import { SEVERITY_HEX, SEVERITY_LABEL } from '../types'
import { useAuth } from '../context/AuthContext'
import { fetchAlerts, resolveAlert } from '../api/alertApi'
import type { OfficerAlert } from '../data/officerData'

const AlertMap = dynamic(() => import('../components/AlertMap'), { ssr: false, loading: () => <div className="w-full h-full bg-slate-900 animate-pulse rounded-xl border border-slate-800" /> })

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

function InfoCell({ icon: Icon, label, value, warn }: {
  icon: React.ElementType; label: string; value: string | number; warn?: boolean
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

function AlertCard({ alert, index, onDeploy, onResolve }: {
  alert: OfficerAlert; index: number; onDeploy: (a: OfficerAlert) => void; onResolve: (id: string) => Promise<void>
}) {
  const [isResolving, setIsResolving] = useState(false)
  const color = SEVERITY_HEX[alert.severity] || '#666'
  const label = SEVERITY_LABEL[alert.severity] || alert.severity
  const isCritical = alert.severity === 'critical'

  const handleResolve = async () => {
    setIsResolving(true)
    try {
      await onResolve(alert.id)
    } catch (e) {
      console.error(e)
      setIsResolving(false)
    }
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden anim-stagger-in ${isCritical ? 'pulse-critical' : ''}`}
      style={{
        background: 'var(--bg-card)',
        borderColor: isCritical ? color : 'var(--border)',
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
            <MapPin size={9} /> {alert.locationName}
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <Clock size={9} /> {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        <InfoCell icon={MapPin} label="Location" value={alert.district || 'Unknown'} />
        <InfoCell icon={Bot} label="AI Confidence" value={`${alert.aiConfidence || 0}%`} />
        <InfoCell icon={Wind} label="Wind Speed" value={`${alert.windSpeed || 0} km/h`} warn={(alert.windSpeed || 0) > 80} />
        <InfoCell icon={Users} label="Population" value={`${((alert.population || 0) / 1000).toFixed(0)}k`} />
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--fg-muted)' }}>
          <Truck size={10} />
          {(alert.deployedTeams || 0) > 0
            ? <span style={{ color: '#16a34a' }}>{alert.deployedTeams} team{(alert.deployedTeams || 0) > 1 ? 's' : ''} deployed</span>
            : <span style={{ color: '#dc2626' }}>No teams deployed</span>
          }
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50"
            style={{ background: 'var(--bg-hover)', color: '#16a34a', border: '1px solid #16a34a40' }}
            onMouseEnter={e => !isResolving && (e.currentTarget.style.background = '#16a34a15')}
            onMouseLeave={e => !isResolving && (e.currentTarget.style.background = 'var(--bg-hover)')}
          >
            <CheckCircle size={12} />
            {isResolving ? 'Resolving...' : 'Resolve'}
          </button>
          <button
            onClick={() => onDeploy(alert)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
            style={{ background: color, color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Truck size={12} />
            Deploy
          </button>
        </div>
      </div>
    </div>
  )
}

function DeployModal({ alert, onClose, onConfirm }: {
  alert: OfficerAlert
  onClose: () => void
  onConfirm: () => void
}) {
  const color = SEVERITY_HEX[alert.severity] || '#666'
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 anim-backdrop"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden anim-scale-up"
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${color}80`,
          boxShadow: `0 8px 32px 0 ${color}20`,
        }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: color + '15' }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
            Deploy Team — {alert.title}
          </div>
          <div className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--fg-muted)' }}>
            {alert.locationName}
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
  const { user, isLoading: authLoading } = useAuth()
  
  const [alerts, setAlerts] = useState<OfficerAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch]       = useState('')
  const [sevFilter, setSevFilter] = useState<Severity | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [distFilter, setDistFilter] = useState('All Districts')
  const [deployTarget, setDeployTarget] = useState<OfficerAlert | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'officer' && user.role !== 'admin'))) {
      router.push('/')
      return
    }

    if (user) {
      loadAlerts()

      // Socket connection for real-time alerts
      const socket = io('http://localhost:5000')

      socket.on('alert_created', () => {
        loadAlerts() // Simplest way to sync
      })

      socket.on('alert_resolved', (data: { alertId: string }) => {
        setAlerts(prev => prev.filter(a => a.id !== data.alertId))
      })

      return () => {
        socket.disconnect()
      }
    }
  }, [user, authLoading, router])

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts()
      setAlerts(data)
    } catch (err) {
      console.error('Failed to load alerts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    await resolveAlert(alertId)
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const stats = useMemo(() => ({
    active:   alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    moderate: alerts.filter(a => a.severity === 'moderate').length,
    advisory: alerts.filter(a => a.severity === 'low' || a.severity === 'safe').length,
  }), [alerts])

  const filtered = useMemo(() => alerts.filter(a => {
    const q = search.toLowerCase()
    if (q && !a.title.toLowerCase().includes(q) && !(a.locationName || '').toLowerCase().includes(q)) return false
    if (sevFilter !== 'all' && a.severity !== sevFilter) return false
    if (typeFilter !== 'All Types' && a.alertType !== typeFilter) return false
    if (distFilter !== 'All Districts' && a.district !== distFilter) return false
    return true
  }), [alerts, search, sevFilter, typeFilter, distFilter])

  if (authLoading || !user || (user.role !== 'officer' && user.role !== 'admin')) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <div className="text-sm font-mono opacity-50">Checking access...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--nav-h))] overflow-hidden p-4 sm:p-6 lg:p-8">
      <style>{`
        @keyframes pulseCritical {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        .pulse-critical {
          animation: pulseCritical 2s infinite;
        }
      `}</style>
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

      <div className="flex-1 overflow-hidden flex flex-col gap-5 px-6 py-5 rounded-b-xl border-x border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
        
        {/* Top Level: Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <StatCard label="Active Alerts" value={stats.active}   color="var(--primary)" />
          <StatCard label="Critical"       value={stats.critical} color="#9333ea" />
          <StatCard label="Moderate"       value={stats.moderate} color="#ea580c" />
          <StatCard label="Advisory"       value={stats.advisory} color="#ca8a04" />
        </div>

        {/* Top Level: Filters */}
        <div
          className="flex flex-wrap items-center gap-2 p-3 rounded-xl border shrink-0"
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
          <div className="flex gap-1 hidden sm:flex">
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

        {/* Bottom Level: 60% List / 40% Map Split */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-5">
          {/* Left Side: 60% List */}
          <div className="flex-1 lg:w-[60%] h-full overflow-hidden">
            <div className="h-full overflow-y-auto space-y-3 pb-10 pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="text-center py-12 text-sm" style={{ color: 'var(--fg-muted)' }}>
                  Loading live alerts...
                </div>
              ) : filtered.length === 0 ? (
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
                    onResolve={handleResolveAlert}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Side: 40% Map */}
          <div className="hidden lg:block lg:w-[40%] h-full relative rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {isLoading ? (
              <div className="w-full h-full bg-slate-900 animate-pulse" />
            ) : (
              <AlertMap alerts={filtered} />
            )}
          </div>
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
