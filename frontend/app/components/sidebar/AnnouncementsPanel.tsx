'use client'

import { ChevronLeft, Clock } from 'lucide-react'
import type { Announcement, Severity } from '../../types'
import { SEVERITY_HEX } from '../../types'
import { useData } from '../../context/DataContext'

interface AnnouncementsPanelProps {
  onBack: () => void
  onSelectAnnouncement: (announcement: Announcement) => void
}

const BADGE_COLORS: Record<string, string> = {
  WEATHER: '#3b82f6',
  RESPONSE: '#16a34a',
  EVACUATION: '#dc2626',
  MARITIME: '#0891b2',
  HEALTH: '#9333ea',
}

export default function AnnouncementsPanel({ onBack, onSelectAnnouncement }: AnnouncementsPanelProps) {
  const { announcements } = useData()
  return (
    <div className="flex flex-col h-full anim-slide-right">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0"
          style={{ color: 'var(--fg-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Back to main panel"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold flex-1" style={{ color: 'var(--fg)' }}>
          Govt. Announcements
        </span>
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-semibold"
          style={{ background: 'var(--accent)' + '18', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
        >
          {announcements.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {announcements.map((ann, i) => {
          const badgeColor = BADGE_COLORS[ann.badge] ?? '#6b7280'
          const sevColor = SEVERITY_HEX[ann.priority as Severity]
          return (
            <button
              key={ann.id}
              onClick={() => onSelectAnnouncement(ann)}
              className="w-full rounded-xl overflow-hidden text-left anim-stagger-in transition-all duration-150"
              style={{
                border: `1px solid var(--border)`,
                borderLeft: `3px solid ${sevColor}`,
                animationDelay: `${i * 0.06}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.transform = 'translateX(2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'none'
              }}
            >
              {/* Badge + timestamp row */}
              <div
                className="flex items-center justify-between px-3 py-1.5"
                style={{ background: 'var(--bg-hover)' }}
              >
                <span
                  className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
                  style={{ background: badgeColor + '18', color: badgeColor, fontFamily: 'var(--font-mono)' }}
                >
                  {ann.badge}
                </span>
                <span className="flex items-center gap-1 text-[9px] font-mono" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                  <Clock size={9} />
                  {ann.timestamp.replace('Today, ', '').replace('Yesterday, ', 'Yest ')}
                </span>
              </div>

              {/* Short title */}
              <div className="px-3 py-2" style={{ background: 'var(--bg-card)' }}>
                <p
                  className="text-xs font-semibold leading-snug line-clamp-2"
                  style={{ color: 'var(--fg)' }}
                >
                  {ann.title}
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--fg-muted)' }}>
                  {ann.agency.split(' — ')[0]}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
