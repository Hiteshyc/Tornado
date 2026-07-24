'use client'

import { useRouter } from 'next/navigation'
import {
  FileText, Bell, BookOpen, Megaphone, AlertTriangle, ChevronRight,
} from 'lucide-react'
import type { SituationStatus, SidebarView } from '../../types'
import { SEVERITY_HEX } from '../../types'
import { currentSituation, alerts, announcements } from '../../data/mockData'

interface MainPanelProps {
  onNavigate: (view: SidebarView) => void
  onReportClick: () => void
}

// ── Situation banner colour helper ───────────────────────────
function getSituationBg(status: SituationStatus['status']) {
  const hex = SEVERITY_HEX[status]
  return { background: hex + '12', border: `1px solid ${hex}28`, color: hex }
}

export default function MainPanel({ onNavigate, onReportClick }: MainPanelProps) {
  const router = useRouter()
  const sit = currentSituation
  const sitStyle = getSituationBg(sit.status)

  const actions = [
    {
      key: 'report' as const,
      icon: FileText,
      label: 'Report Hazard',
      desc: 'Submit a new hazard report',
      color: '#1a5fc4',
      badge: null,
      onClick: onReportClick,
    },
    {
      key: 'alerts' as const,
      icon: Bell,
      label: 'Active Alerts',
      desc: `${alerts.length} alerts in your region`,
      color: '#dc2626',
      badge: String(alerts.length),
      onClick: () => router.push('/alerts'),
    },
    {
      key: 'safety' as const,
      icon: BookOpen,
      label: 'Safety Guide',
      desc: 'Emergency guidelines by hazard type',
      color: '#16a34a',
      badge: null,
      onClick: () => onNavigate('safety'),
    },
    {
      key: 'announcements' as const,
      icon: Megaphone,
      label: 'Govt. Announcements',
      desc: `${announcements.length} new bulletins`,
      color: '#ea580c',
      badge: String(announcements.length),
      onClick: () => onNavigate('announcements'),
    },
  ]

  return (
    <div className="flex flex-col h-full anim-slide-right">
      {/* Panel title */}
      <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[10px] uppercase tracking-widest font-mono mb-0.5" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
          Action Panel
        </div>
        <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
          Emergency Actions
        </div>
      </div>

      {/* Situation summary */}
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[9px] uppercase tracking-wider font-mono mb-2" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
          Current Situation
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg" style={sitStyle}>
          <AlertTriangle size={14} className="shrink-0" style={{ color: SEVERITY_HEX[sit.status] }} />
          <div>
            <div className="text-[11px] font-bold" style={{ color: SEVERITY_HEX[sit.status] }}>
              {sit.title}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
              {sit.description}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {actions.map((action, i) => {
          const Icon = action.icon
          return (
            <button
              key={action.key}
              onClick={action.onClick}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 anim-stagger-in group"
              style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                animationDelay: `${i * 0.07}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-card)'
                e.currentTarget.style.borderColor = action.color + '50'
                e.currentTarget.style.transform = 'translateX(3px)'
                e.currentTarget.style.boxShadow = 'var(--shadow)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: action.color + '18', color: action.color }}
              >
                <Icon size={16} strokeWidth={1.8} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                  {action.label}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                  {action.desc}
                </div>
              </div>

              {/* Badge or chevron */}
              {action.badge ? (
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 anim-blink"
                  style={{ background: action.color, color: '#fff', fontFamily: 'var(--font-mono)' }}
                >
                  {action.badge}
                </span>
              ) : (
                <ChevronRight size={14} style={{ color: 'var(--fg-muted)' }} className="shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {/* Bottom status */}
      <div
        className="px-4 py-3 border-t shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
            System Status
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
            <span className="w-1.5 h-1.5 rounded-full anim-blink" style={{ background: '#16a34a' }} />
            OPERATIONAL
          </span>
        </div>
        <div className="text-[9px]" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
          Last updated: 2 min ago · IMD Feed Active
        </div>
      </div>
    </div>
  )
}
