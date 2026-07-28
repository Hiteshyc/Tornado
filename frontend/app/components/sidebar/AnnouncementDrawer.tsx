'use client'

import { ChevronsRight, Building2 } from 'lucide-react'
import type { Announcement } from '../../types'
import { SEVERITY_HEX } from '../../types'

interface AnnouncementDrawerProps {
  announcement: Announcement
  onCollapse: () => void
}

const BADGE_COLORS: Record<string, string> = {
  WEATHER: '#3b82f6',
  RESPONSE: '#16a34a',
  EVACUATION: '#dc2626',
  MARITIME: '#0891b2',
  HEALTH: '#9333ea',
}

export default function AnnouncementDrawer({ announcement: ann, onCollapse }: AnnouncementDrawerProps) {
  const badgeColor = BADGE_COLORS[ann.badge] ?? '#6b7280'
  const sevColor = SEVERITY_HEX[ann.priority]

  return (
    <div
      className="flex flex-col h-full border-r anim-drawer"
      style={{
        width: 'var(--drawer-w)',
        background: 'var(--bg-panel)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
          style={{ background: badgeColor + '18', color: badgeColor, fontFamily: 'var(--font-mono)' }}
        >
          {ann.badge}
        </span>
        {/* Collapse arrow — top-right */}
        <div className="flex-1" />
        <button
          onClick={onCollapse}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0"
          style={{ color: 'var(--fg-muted)' }}
          title="Collapse panel"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Collapse announcement drawer"
        >
          <ChevronsRight size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 anim-fade-up">
        {/* Priority bar */}
        <div
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
          style={{ background: sevColor + '10', border: `1px solid ${sevColor}22` }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sevColor }} />
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: sevColor, fontFamily: 'var(--font-mono)' }}>
            {ann.priority} priority
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-sm font-bold leading-snug" style={{ color: 'var(--fg)' }}>
            {ann.title}
          </h2>
        </div>

        {/* Full body */}
        <div
          className="text-xs leading-relaxed p-3 rounded-xl"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--fg)' }}
        >
          {ann.body}
        </div>

        {/* Agency + timestamp */}
        <div
          className="flex items-start gap-2 px-2.5 py-2 rounded-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <Building2 size={12} className="shrink-0 mt-0.5" style={{ color: 'var(--fg-muted)' }} />
          <div>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--fg)' }}>{ann.agency}</p>
            <p className="text-[9px] mt-0.5 font-mono" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
              Issued: {ann.timestamp}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
