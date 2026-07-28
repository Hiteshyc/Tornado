'use client'

import { CheckCircle2, XCircle, ChevronsRight } from 'lucide-react'
import type { SafetyGuide } from '../../types'

interface SafetyGuideDrawerProps {
  guide: SafetyGuide
  onCollapse: () => void
}

export default function SafetyGuideDrawer({ guide, onCollapse }: SafetyGuideDrawerProps) {
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
        <span className="text-base shrink-0">{guide.icon}</span>
        <span className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--fg)' }}>
          {guide.title}
        </span>
        {/* Collapse arrow — top-right */}
        <button
          onClick={onCollapse}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0"
          style={{ color: 'var(--fg-muted)' }}
          title="Collapse panel"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Collapse safety guide drawer"
        >
          <ChevronsRight size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Do's */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 size={13} style={{ color: '#16a34a' }} />
            <span
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: '#16a34a', fontFamily: 'var(--font-mono)' }}
            >
              Do&apos;s
            </span>
          </div>
          <div className="space-y-1.5">
            {guide.dos.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-xs anim-stagger-in"
                style={{
                  background: '#16a34a0d',
                  border: '1px solid #16a34a1a',
                  color: 'var(--fg)',
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <span className="shrink-0 mt-0.5" style={{ color: '#16a34a' }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Don'ts */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle size={13} style={{ color: '#dc2626' }} />
            <span
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: '#dc2626', fontFamily: 'var(--font-mono)' }}
            >
              Don&apos;ts
            </span>
          </div>
          <div className="space-y-1.5">
            {guide.donts.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-xs anim-stagger-in"
                style={{
                  background: '#dc26260d',
                  border: '1px solid #dc26261a',
                  color: 'var(--fg)',
                  animationDelay: `${(guide.dos.length + i) * 0.05}s`,
                }}
              >
                <span className="shrink-0 mt-0.5" style={{ color: '#dc2626' }}>✗</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
