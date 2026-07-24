'use client'

import { ChevronLeft } from 'lucide-react'
import type { SafetyGuide } from '../../types'
import { safetyGuides } from '../../data/mockData'

interface SafetyGuidePanelProps {
  onBack: () => void
  onSelectGuide: (guide: SafetyGuide) => void
}

const categories = safetyGuides.map(g => ({ key: g.key, label: g.title, icon: g.icon }))

export default function SafetyGuidePanel({ onBack, onSelectGuide }: SafetyGuidePanelProps) {
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
          Safety Guide
        </span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: 'var(--fg-muted)', background: 'var(--bg-hover)', fontFamily: 'var(--font-mono)' }}>
          {categories.length} types
        </span>
      </div>

      {/* Subtitle */}
      <div className="px-3 pt-2.5 pb-1 shrink-0">
        <p className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>
          Select a hazard type to view emergency guidelines.
        </p>
      </div>

      {/* Category grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {safetyGuides.map((guide, i) => (
            <button
              key={guide.key}
              onClick={() => onSelectGuide(guide)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all duration-150 anim-stagger-in"
              style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                animationDelay: `${i * 0.04}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-card)'
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--shadow)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span className="text-2xl">{guide.icon}</span>
              <span className="text-xs font-medium leading-tight" style={{ color: 'var(--fg)' }}>
                {guide.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
