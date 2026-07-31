'use client'

import { useState, useMemo, Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { io } from 'socket.io-client'
import {
  Search, ChevronDown, ChevronUp, Truck, Users, Bot, Wind,
  MapPin, Clock, CheckCircle2, FileText, RotateCcw,
  Plus, X, AlertTriangle, Send, Activity, Navigation, Goal, ArrowLeft
} from 'lucide-react'
import {
  OPERATION_STATUSES, STATUS_LABEL, STATUS_COLOR,
  TEAM_STATUS_COLOR, TEAM_STATUS_LABEL,
  type OperationStatus,
} from '../data/officerData'
import { SEVERITY_HEX, SEVERITY_LABEL } from '../types'
import type { Severity, Team } from '../types'
import { fetchDeployments, updateDeployment } from '../api/deploymentApi'
import { fetchTeams } from '../api/teamApi'
import { useAuth } from '../context/AuthContext'

// Types adjusted for live API data
export type LiveDeployment = {
  id: string
  alertId: string
  alertTitle: string
  location: string
  severity: Severity
  aiConfidence: number
  windSpeed: number
  assignedTeamIds: string[]
  status: OperationStatus
  startTime: string
  missionReport?: {
    teamLead: string
    completionTime: string
    peopleRescued: number
    submittedAt: string
    resourcesUsed: string[]
    remarks: string
  } | null
}

// ── Stepper UI (Feature B) ──────────────────────────────────
function StatusStepper({ status }: { status: OperationStatus }) {
  const steps: { key: OperationStatus; label: string; icon: any }[] = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'en-route', label: 'En Route', icon: Navigation },
    { key: 'rescue-ongoing', label: 'Ongoing', icon: Activity },
    { key: 'completed', label: 'Completed', icon: Goal },
  ]
  
  const currentIndex = steps.findIndex(s => s.key === status)
  
  return (
    <div className="flex items-center gap-2 py-4 px-2 overflow-x-auto custom-scrollbar">
      {steps.map((s, i) => {
        const isPast = i < currentIndex
        const isCurrent = i === currentIndex
        const Icon = s.icon
        const color = isPast ? '#16a34a' : isCurrent ? STATUS_COLOR[s.key] : 'var(--fg-muted)'
        
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div 
              className={`flex flex-col items-center gap-1.5 transition-all ${isCurrent ? 'opacity-100 scale-110' : 'opacity-60'}`}
              style={{ color }}
            >
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ 
                  background: isPast || isCurrent ? color + '22' : 'var(--bg-hover)',
                  border: `1px solid ${isPast || isCurrent ? color : 'var(--border)'}` 
                }}
              >
                <Icon size={12} className={isCurrent && s.key === 'rescue-ongoing' ? 'anim-blink' : ''} />
              </div>
              <span className="text-[9px] uppercase tracking-wider font-mono font-bold">
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div 
                className="w-8 h-[2px] rounded-full transition-colors mx-1"
                style={{ background: i < currentIndex ? '#16a34a' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Relocate Modal ──────────────────────────────────────────
function RelocateModal({ teamId, fromDepId, deployments, teams, onConfirm, onClose }: {
  teamId: string
  fromDepId: string
  deployments: LiveDeployment[]
  teams: Team[]
  onConfirm: (toDepId: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState('')
  const team = teams.find(t => t.id === teamId)
  const targets = deployments.filter(d => d.id !== fromDepId && d.status !== 'completed' && d.status !== 'failed')

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 anim-backdrop"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden anim-scale-up"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)' }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Relocate Team</div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--fg-muted)' }}>
              {team?.name} · {team?.leader}
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--fg-muted)' }}>
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2">
          <div className="text-xs mb-3" style={{ color: 'var(--fg-muted)' }}>
            Select the operation to relocate this team to:
          </div>
          {targets.length === 0 ? (
            <div className="text-xs text-center py-6" style={{ color: 'var(--fg-muted)' }}>
              No other active operations available.
            </div>
          ) : targets.map(d => {
            const isSelected = selected === d.id
            const color = SEVERITY_HEX[d.severity]
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{
                  background: isSelected ? color + '10' : 'var(--bg-hover)',
                  border: `1px solid ${isSelected ? color : 'var(--border)'}`,
                }}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: 'var(--fg)' }}>{d.alertTitle}</div>
                  <div className="text-[10px] font-mono" style={{ color: 'var(--fg-muted)' }}>{d.location}</div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 px-5 pb-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs border" style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}>Cancel</button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-opacity"
            style={{ background: 'var(--primary)', color: '#fff', opacity: selected ? 1 : 0.4 }}
          >
            Relocate →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Mission Report Modal ────────────────────────────────────
function MissionReportModal({ dep, onApprove, onRequestChanges, onClose }: {
  dep: LiveDeployment
  onApprove: () => void
  onRequestChanges: () => void
  onClose: () => void
}) {
  const r = dep.missionReport
  const [stage, setStage] = useState<'view' | 'approved' | 'changes'>('view')
  const [changeNote, setChangeNote] = useState('')

  if (stage === 'approved') {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 anim-backdrop" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
        <style>{`
          @keyframes confettiBurst {
            0% { transform: scale(0.5); opacity: 1; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .confetti-burst::before {
            content: '';
            position: absolute;
            inset: -40px;
            border-radius: 50%;
            background: radial-gradient(circle, #16a34a33 0%, transparent 70%);
            animation: confettiBurst 0.8s ease-out forwards;
            pointer-events: none;
            z-index: -1;
          }
        `}</style>
        <div className="w-full max-w-sm rounded-2xl overflow-hidden anim-scale-up text-center p-8 space-y-4 relative z-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto relative confetti-burst" style={{ background: '#16a34a18' }}>
            <CheckCircle2 size={32} style={{ color: '#16a34a' }} />
          </div>
          <div>
            <div className="text-base font-semibold" style={{ color: 'var(--fg)' }}>Mission Approved</div>
            <div className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
              Operation marked Successful. Teams have been released back to Available status.
            </div>
          </div>
          <button onClick={() => { onApprove(); onClose() }} className="px-6 py-2 rounded-xl text-sm font-medium" style={{ background: '#16a34a', color: '#fff' }}>
            Close
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'changes') {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 anim-backdrop" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full max-w-sm rounded-2xl overflow-hidden anim-scale-up space-y-4 p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Request Changes</div>
          <textarea
            value={changeNote}
            onChange={e => setChangeNote(e.target.value)}
            placeholder="Describe what needs to be corrected..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg text-xs resize-none outline-none"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
          />
          <div className="flex gap-2">
            <button onClick={() => setStage('view')} className="flex-1 py-2 rounded-xl text-xs border" style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}>Back</button>
            <button
              onClick={() => { onRequestChanges(); onClose() }}
              disabled={!changeNote.trim()}
              className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity"
              style={{ background: '#ca8a04', color: '#fff', opacity: changeNote.trim() ? 1 : 0.4 }}
            >
              <Send size={11} /> Send Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 anim-backdrop" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden anim-scale-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)' }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Mission Report</div>
            <div className="text-[10px] font-mono" style={{ color: 'var(--fg-muted)' }}>{dep.alertTitle}</div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--fg-muted)' }}><X size={14} /></button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 10rem)' }}>
          <div className="px-5 py-4 space-y-4">
            <ReportField label="Team Lead"       value={r?.teamLead || 'Unknown'} />
            <ReportField label="Completed At"    value={r?.completionTime || 'Unknown'} />
            <ReportField label="People Rescued"  value={String(r?.peopleRescued || 0)} highlight />
            <ReportField label="Submitted At"    value={r?.submittedAt || 'Unknown'} />

            <div>
              <div className="text-[9px] uppercase tracking-wider font-mono mb-1.5" style={{ color: 'var(--fg-muted)' }}>Resources Used</div>
              <div className="flex flex-wrap gap-1">
                {(r?.resourcesUsed || []).map(item => (
                  <span key={item} className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: 'var(--bg-hover)', color: 'var(--fg-muted)', border: '1px solid var(--border)' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-wider font-mono mb-1.5" style={{ color: 'var(--fg-muted)' }}>Remarks</div>
              <div className="text-xs px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--fg)', lineHeight: 1.6 }}>
                {r?.remarks || 'No remarks provided.'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setStage('changes')}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors"
            style={{ borderColor: '#ca8a04', color: '#ca8a04' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#ca8a0410')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Request Changes
          </button>
          <button
            onClick={() => setStage('approved')}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{ background: '#16a34a', color: '#fff' }}
          >
            <CheckCircle2 size={13} /> Approve & Close
          </button>
        </div>
      </div>
    </div>
  )
}

function ReportField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
      <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: 'var(--fg-muted)' }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: highlight ? '#16a34a' : 'var(--fg)' }}>{value}</span>
    </div>
  )
}

// ── Deployment Card ─────────────────────────────────────────
function DeploymentCard({ dep, index, allDeployments, allTeams, onUpdate }: {
  dep: LiveDeployment
  index: number
  allDeployments: LiveDeployment[]
  allTeams: Team[]
  onUpdate: (id: string, patch: Partial<LiveDeployment>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [relocateTeam, setRelocateTeam] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<OperationStatus>(dep.status)

  const color = SEVERITY_HEX[dep.severity] || SEVERITY_HEX['low']
  const statusColor = STATUS_COLOR[dep.status]
  const assignedTeams = allTeams.filter(t => dep.assignedTeamIds.includes(t.id || t._id))
  // For relocation/deployment, fetch available teams
  const availableTeams = allTeams.filter(t => t.status === 'available' && !dep.assignedTeamIds.includes(t.id || t._id))

  const handleDeploy = async (teamId: string) => {
    const updatedIds = [...dep.assignedTeamIds, teamId]
    try {
      await updateDeployment(dep.id, { assignedTeamIds: updatedIds })
      onUpdate(dep.id, { assignedTeamIds: updatedIds })
    } catch (e) {
      console.error(e)
    }
  }

  const handleRelocate = async (teamId: string, toDepId: string) => {
    // Remove from current
    const currentUpdated = dep.assignedTeamIds.filter(id => id !== teamId)
    // Add to target
    const targetDep = allDeployments.find(d => d.id === toDepId)
    const targetUpdated = [...(targetDep?.assignedTeamIds || []), teamId]
    
    setRelocateTeam(null)
    try {
      await updateDeployment(dep.id, { assignedTeamIds: currentUpdated })
      await updateDeployment(toDepId, { assignedTeamIds: targetUpdated })
      onUpdate(dep.id, { assignedTeamIds: currentUpdated })
      onUpdate(toDepId, { assignedTeamIds: targetUpdated })
    } catch (e) {
      console.error(e)
    }
  }

  const handleStatusUpdate = async () => {
    setUpdatingStatus(true)
    try {
      await updateDeployment(dep.id, { status: newStatus })
      onUpdate(dep.id, { status: newStatus })
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div
      className="rounded-xl border overflow-hidden anim-stagger-in"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        borderTop: `3px solid ${color}`,
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Card header */}
      <div
        className="flex items-start justify-between gap-3 px-4 py-3 cursor-pointer border-b"
        style={{ borderColor: 'var(--border)', background: color + '06' }}
        onClick={() => setExpanded(p => !p)}
      >
        <div>
          <div className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--fg)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            {dep.alertTitle}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono mt-1" style={{ color: 'var(--fg-muted)' }}>
            <MapPin size={9} /> {dep.location}
            <span>·</span>
            <Clock size={9} /> Started: {dep.startTime}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase"
            style={{ background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}30` }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dep.status === 'rescue-ongoing' ? 'anim-blink' : ''}`} style={{ background: statusColor }} />
            {STATUS_LABEL[dep.status]}
          </div>
          {expanded ? <ChevronUp size={14} style={{ color: 'var(--fg-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--fg-muted)' }} />}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--border)' }}>
        <SumCell icon={Users} label="Assigned Teams" value={`${assignedTeams.length}`} />
        <SumCell icon={Bot} label="AI Confidence" value={`${dep.aiConfidence}%`} />
        <SumCell icon={Wind} label="Wind Speed" value={`${dep.windSpeed} km/h`} warn={dep.windSpeed > 80} />
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="divide-y anim-fade-up" style={{ borderColor: 'var(--border)' }}>
          {/* Mission Timeline (Feature B) */}
          <div className="px-4 border-b" style={{ borderColor: 'var(--border)' }}>
             <StatusStepper status={dep.status} />
          </div>

          {/* Assigned teams */}
          <Section label="Assigned Teams" count={assignedTeams.length}>
            {assignedTeams.length === 0 ? (
              <div className="text-xs py-2" style={{ color: 'var(--fg-muted)' }}>No teams assigned yet.</div>
            ) : assignedTeams.map(t => {
              const tc = TEAM_STATUS_COLOR[t.status] || TEAM_STATUS_COLOR['available']
              return (
                <div key={t.id || t._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: tc }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--fg)' }}>{t.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>· {t.leader}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: tc + '18', color: tc }}>
                      {TEAM_STATUS_LABEL[t.status] || t.status}
                    </span>
                  </div>
                  {dep.status !== 'completed' && dep.status !== 'failed' && (
                    <button
                      onClick={() => setRelocateTeam(t.id || t._id)}
                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors"
                      style={{ color: '#ca8a04', border: '1px solid #ca8a0430' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#ca8a0410')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <RotateCcw size={9} /> Relocate
                    </button>
                  )}
                </div>
              )
            })}
          </Section>

          {/* Available teams to deploy */}
          {dep.status !== 'completed' && dep.status !== 'failed' && availableTeams.length > 0 && (
            <Section label="Available Teams" count={availableTeams.length}>
              {availableTeams.slice(0, 3).map(t => (
                <div key={t.id || t._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-xs" style={{ color: 'var(--fg)' }}>{t.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>· {t.leader}</span>
                  </div>
                  <button
                    onClick={() => handleDeploy(t.id || t._id)}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors"
                    style={{ color: '#16a34a', border: '1px solid #16a34a30' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#16a34a10')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Plus size={9} /> Deploy
                  </button>
                </div>
              ))}
            </Section>
          )}

          {/* Status update manually */}
          {dep.status !== 'completed' && dep.status !== 'failed' && (
            <div className="px-4 py-3 flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-wider font-mono shrink-0" style={{ color: 'var(--fg-muted)' }}>
                Update Phase
              </span>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as OperationStatus)}
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
              >
                {OPERATION_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={newStatus === dep.status || updatingStatus}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                style={{
                  background: newStatus !== dep.status ? 'var(--primary)' : 'var(--bg-hover)',
                  color: newStatus !== dep.status ? '#fff' : 'var(--fg-muted)',
                  opacity: updatingStatus ? 0.6 : 1,
                }}
              >
                {updatingStatus ? <span className="anim-blink">Updating…</span> : 'Sync'}
              </button>
            </div>
          )}

          {/* Mission report */}
          <div className="px-4 py-3 flex items-center justify-end">
            {dep.missionReport ? (
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: '#16a34a', color: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <FileText size={12} /> View Mission Report
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--fg-muted)' }}>
                <AlertTriangle size={11} />
                Report not yet submitted by Team Lead
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {relocateTeam && (
        <RelocateModal
          teamId={relocateTeam}
          fromDepId={dep.id}
          deployments={allDeployments}
          teams={allTeams}
          onConfirm={(toDepId) => handleRelocate(relocateTeam, toDepId)}
          onClose={() => setRelocateTeam(null)}
        />
      )}
      {showReport && dep.missionReport && (
        <MissionReportModal
          dep={dep}
          onApprove={async () => {
             await updateDeployment(dep.id, { status: 'completed' })
             onUpdate(dep.id, { status: 'completed' })
          }}
          onRequestChanges={() => {}}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}

function SumCell({ icon: Icon, label, value, warn }: {
  icon: React.ElementType; label: string; value: string; warn?: boolean
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
      <Icon size={12} style={{ color: warn ? '#dc2626' : 'var(--fg-muted)' }} className="shrink-0" />
      <div>
        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>{label}</div>
        <div className="text-sm font-mono font-semibold" style={{ color: warn ? '#dc2626' : 'var(--fg)' }}>{value}</div>
      </div>
    </div>
  )
}

function Section({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: 'var(--fg-muted)' }}>{label}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: 'var(--bg-hover)', color: 'var(--fg-muted)', border: '1px solid var(--border)' }}>
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────
function DeploymentsContent() {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const alertId = searchParams.get('alertId')
  
  const [deps, setDeps] = useState<LiveDeployment[]>([])
  const [teamsData, setTeamsData] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OperationStatus | 'all'>('all')
  const [sevFilter, setSevFilter] = useState<Severity | 'all'>('all')

  useEffect(() => {
    if (authLoading || !user || (user.role !== 'officer' && user.role !== 'admin')) {
      return
    }
    
    async function loadData() {
      try {
        const [liveDeps, liveTeams] = await Promise.all([
          fetchDeployments(),
          fetchTeams()
        ])
        setDeps(liveDeps)
        setTeamsData(liveTeams)
      } catch (err) {
        console.error("Failed to load operations data", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()

    // Socket sync (Feature A)
    const socket = io('http://localhost:5000')
    socket.on('deployment_updated', (data: { deploymentId: string; update: any }) => {
      setDeps(prev => prev.map(d => d.id === data.deploymentId ? { ...d, ...data.update } : d))
    })

    return () => {
      socket.disconnect()
    }
  }, [authLoading, user])

  const handleUpdate = (id: string, patch: Partial<LiveDeployment>) => {
    setDeps(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d))
  }

  const filtered = useMemo(() => deps.filter(d => {
    const q = search.toLowerCase()
    if (q && !d.alertTitle.toLowerCase().includes(q) && !d.location.toLowerCase().includes(q)) return false
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (sevFilter !== 'all' && d.severity !== sevFilter) return false
    return true
  }), [deps, search, statusFilter, sevFilter])

  const active = deps.filter(d => d.status !== 'completed' && d.status !== 'failed').length
  const ongoing = deps.filter(d => d.status === 'rescue-ongoing').length
  const completed = deps.filter(d => d.status === 'completed').length

  if (authLoading || !user || (user.role !== 'officer' && user.role !== 'admin')) {
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg transition-colors mr-1"
            style={{ color: 'var(--fg-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Deployments</div>
            <div className="text-[10px] font-mono" style={{ color: 'var(--fg-muted)' }}>
              Live Operations Command Center · {active} active
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 rounded-b-xl border-x border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard2 label="Active Ops"    value={active}    color="var(--primary)" />
          <StatCard2 label="Rescue Ongoing" value={ongoing}   color="#dc2626" />
          <StatCard2 label="Completed"      value={completed} color="#16a34a" />
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
              placeholder="Search deployments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as OperationStatus | 'all')}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
          >
            <option value="all">All Status</option>
            {OPERATION_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>

          <div className="flex gap-1">
            {(['all', 'critical', 'high', 'moderate', 'low'] as const).map(s => {
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
        </div>

        {/* Deployment cards */}
        <div className="space-y-4 pb-10">
          {isLoading ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--fg-muted)' }}>Loading live operations...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--fg-muted)' }}>No deployments match filters.</div>
          ) : filtered.map((d, i) => (
            <DeploymentCard
              key={d.id}
              dep={d}
              index={i}
              allDeployments={deps}
              allTeams={teamsData}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard2({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-xl border anim-fade-up flex flex-col sm:flex-row sm:items-center gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-3xl font-mono font-semibold" style={{ color }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>{label}</div>
    </div>
  )
}

export default function DeploymentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-mono opacity-50">Loading Deployments...</div>}>
      <DeploymentsContent />
    </Suspense>
  )
}
