'use client'

import { useState, useMemo } from 'react'
import {
  Search, ChevronDown, ChevronUp, Users, CheckCircle2,
  AlertCircle, WifiOff, Truck, MapPin, Layers, Radio,
} from 'lucide-react'
import {
  teams, TEAM_STATUS_COLOR, TEAM_STATUS_LABEL,
  type TeamStatus, type VehicleType
} from '../data/officerData'

const STATUS_OPTS: Array<TeamStatus | 'all'> = ['all', 'available', 'on-mission', 'travelling', 'offline']
const HUB_OPTS = ['All Hubs', 'Panaji Disaster Hub', 'Margao Emergency Base', 'Vasco Emergency Center', 'Dabolim Airbase', 'Mapusa Reserve Base']
const VEH_OPTS: Array<VehicleType | 'All'> = ['All', 'Rescue Boat', 'Ambulance', 'Fire Truck', 'Helicopter', 'Amphibious Vehicle']

const STATUS_ICON = {
  'available':  CheckCircle2,
  'on-mission': AlertCircle,
  'travelling': Truck,
  'offline':    WifiOff,
}

function StatCard({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon: React.ElementType
}) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl border anim-fade-up"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + '18', color }}>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div>
        <div className="text-2xl font-semibold leading-none font-mono" style={{ color }}>{value}</div>
        <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--fg-muted)' }}>{label}</div>
      </div>
    </div>
  )
}

function TeamRow({ team, index }: { team: typeof teams[0]; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const color = TEAM_STATUS_COLOR[team.status]
  const label = TEAM_STATUS_LABEL[team.status]
  const StatusIcon = STATUS_ICON[team.status]

  return (
    <div
      className="rounded-xl border overflow-hidden anim-stagger-in"
      style={{
        background: 'var(--bg-card)',
        borderColor: expanded ? 'var(--primary)' + '40' : 'var(--border)',
        animationDelay: `${index * 0.05}s`,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Compact row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        onClick={() => setExpanded(p => !p)}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Team name */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{team.name}</div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--fg-muted)' }}>{team.leader}</div>
        </div>

        {/* Vehicle */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: 'var(--fg-muted)', minWidth: 130 }}>
          <Truck size={12} />
          <span className="truncate">{team.vehicle}</span>
        </div>

        {/* Hub */}
        <div className="hidden md:block text-[10px] truncate" style={{ color: 'var(--fg-muted)', minWidth: 160 }}>
          {team.hub}
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase shrink-0"
          style={{ background: color + '18', color, border: `1px solid ${color}30` }}
        >
          <StatusIcon size={10} />
          {label}
        </div>

        {/* Expand toggle */}
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            color: expanded ? 'var(--primary)' : 'var(--fg-muted)',
            background: expanded ? 'var(--primary)' + '15' : 'transparent',
          }}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {/* Expanded view */}
      {expanded && (
        <div
          className="border-t px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 anim-fade-up"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)' }}
        >
          {/* Members */}
          <DetailSection icon={Users} label="Team Members">
            <div className="space-y-1">
              {team.members.map(m => (
                <div key={m.name} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--fg)' }}>{m.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                    style={{ background: 'var(--bg-card)', color: 'var(--fg-muted)', border: '1px solid var(--border)' }}
                  >
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </DetailSection>

          {/* Equipment */}
          <DetailSection icon={Layers} label="Equipment">
            <div className="flex flex-wrap gap-1">
              {team.equipment.map(e => (
                <span
                  key={e}
                  className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                  style={{ background: 'var(--bg-card)', color: 'var(--fg-muted)', border: '1px solid var(--border)' }}
                >
                  {e}
                </span>
              ))}
            </div>
          </DetailSection>

          {/* GPS */}
          <DetailSection icon={MapPin} label="Current GPS Location">
            <div className="text-xs" style={{ color: 'var(--fg)' }}>{team.gps.label}</div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--fg-muted)' }}>
              {team.gps.lat.toFixed(4)}° N, {team.gps.lng.toFixed(4)}° E
            </div>
          </DetailSection>

          {/* Mission status */}
          <DetailSection icon={Radio} label="Mission Status">
            <div
              className="text-xs px-2.5 py-1.5 rounded-lg"
              style={{ background: color + '10', color, border: `1px solid ${color}20` }}
            >
              {team.missionStatus}
            </div>
            <div className="text-[10px] mt-1.5" style={{ color: 'var(--fg-muted)' }}>
              <span className="font-mono" style={{ color: 'var(--fg-muted)' }}>Previous: </span>
              {team.previousMission}
            </div>
          </DetailSection>
        </div>
      )}
    </div>
  )
}

function DetailSection({ icon: Icon, label, children }: {
  icon: React.ElementType; label: string; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={12} style={{ color: 'var(--fg-muted)' }} />
        <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: 'var(--fg-muted)' }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

export default function TeamManagement() {
  const [search, setSearch]     = useState('')
  const [statusF, setStatusF]   = useState<TeamStatus | 'all'>('all')
  const [hubF, setHubF]         = useState('All Hubs')
  const [vehicleF, setVehicleF] = useState<VehicleType | 'All'>('All')

  const stats = useMemo(() => ({
    total:    teams.length,
    available: teams.filter(t => t.status === 'available').length,
    onMission: teams.filter(t => t.status === 'on-mission' || t.status === 'travelling').length,
    offline:   teams.filter(t => t.status === 'offline').length,
  }), [])

  const filtered = useMemo(() => teams.filter(t => {
    const q = search.toLowerCase()
    if (q && !t.name.toLowerCase().includes(q) && !t.leader.toLowerCase().includes(q)) return false
    if (statusF !== 'all' && t.status !== statusF) return false
    if (hubF !== 'All Hubs' && t.hub !== hubF) return false
    if (vehicleF !== 'All' && t.vehicle !== vehicleF) return false
    return true
  }), [search, statusF, hubF, vehicleF])

  return (
    <div className="flex flex-col h-[calc(100vh-var(--nav-h))] overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-3 border-b rounded-t-xl"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Team Management</div>
          <div className="text-[10px] font-mono" style={{ color: 'var(--fg-muted)' }}>
            Monitoring {teams.length} rescue teams · Read-only
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--fg-muted)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 anim-blink" />
          Live feed
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 rounded-b-xl border-x border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Teams"  value={stats.total}     color="var(--primary)" icon={Users} />
          <StatCard label="Available"    value={stats.available} color="#16a34a"         icon={CheckCircle2} />
          <StatCard label="On Mission"   value={stats.onMission} color="#dc2626"         icon={AlertCircle} />
          <StatCard label="Offline"      value={stats.offline}   color="#6b7280"         icon={WifiOff} />
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap items-center gap-2 p-3 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 min-w-40"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
          >
            <Search size={13} style={{ color: 'var(--fg-muted)' }} />
            <input
              type="text"
              placeholder="Search team or leader..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          {/* Status filter */}
          <FilterSelect label="Status" value={statusF} onChange={setStatusF as any}>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : TEAM_STATUS_LABEL[s as TeamStatus] ?? s}</option>)}
          </FilterSelect>

          {/* Hub filter */}
          <FilterSelect label="Hub" value={hubF} onChange={setHubF}>
            {HUB_OPTS.map(h => <option key={h} value={h}>{h}</option>)}
          </FilterSelect>

          {/* Vehicle filter */}
          <FilterSelect label="Vehicle" value={vehicleF} onChange={setVehicleF as any}>
            {VEH_OPTS.map(v => <option key={v} value={v}>{v}</option>)}
          </FilterSelect>
        </div>

        {/* Table header */}
        <div className="px-4 grid grid-cols-[1fr_130px_160px_140px_32px] gap-3 items-center">
          {['Team / Leader', 'Vehicle', 'Disaster Hub', 'Status', ''].map(h => (
            <div key={h} className="text-[9px] uppercase tracking-widest font-mono" style={{ color: 'var(--fg-muted)' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Team list */}
        <div className="space-y-2 pb-10">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--fg-muted)' }}>
              No teams match the current filters.
            </div>
          ) : (
            filtered.map((t, i) => <TeamRow key={t.id} team={t} index={i} />)
          )}
        </div>
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-2.5 py-1.5 rounded-lg text-xs outline-none transition-colors cursor-pointer"
      style={{
        background: 'var(--bg-hover)',
        border: '1px solid var(--border)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-sans)',
      }}
      aria-label={label}
    >
      {children}
    </select>
  )
}
