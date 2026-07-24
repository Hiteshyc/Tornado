<<<<<<< HEAD
'use client'
=======
/**
 * page.tsx
 *
 * Root page of the application ( "/" route ).
 *
 * This is the main entry point for all users — both guests and logged-in
 * users land here. The Navbar (rendered by layout.tsx) handles the
 * authentication state, so this page only needs to render the app content.
 *
 * Current state (husk phase):
 *   A placeholder shell is rendered so the Navbar can be tested in isolation.
 *
 * Next phase:
 *   Replace the placeholder <div> with the actual <MapSection> and
 *   <ActionPanel> components ported from the reference design.
 */
>>>>>>> origin/UI/navbar

import { useState } from 'react'
import MapSection from './components/MapSection'
import ActionPanel from './components/ActionPanel'

/**
 * Main landing page — same view as post-login/register.
 *
 * Layout:
 *   [Map / Report Form area] | [Right Sidebar (ActionPanel)]
 *
 * The ActionPanel is fully self-contained. This page only manages
 * whether the report form overlay is shown in the main area.
 */
export default function Home() {
  const [showReportForm, setShowReportForm] = useState(false)

  return (
<<<<<<< HEAD
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Main content row ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Map or Report Form ─────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          {showReportForm ? (
            /* Report Form — rendered in main area */
            <div className="flex flex-col h-full items-center justify-center" style={{ background: 'var(--bg)' }}>
              <div
                className="w-full max-w-lg mx-4 rounded-2xl p-6 anim-scale-up"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--fg)' }}>Report a Hazard</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                      Functionality will be connected to backend later.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors"
                    style={{ color: 'var(--fg-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    aria-label="Close report form"
                  >
                    ✕
                  </button>
                </div>

                {/* Form fields placeholder */}
                <div className="space-y-3">
                  {['Hazard Type', 'Location', 'Description'].map(label => (
                    <div key={label}>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>
                        {label}
                      </label>
                      <input
                        type="text"
                        placeholder={`Enter ${label.toLowerCase()}...`}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                        style={{
                          background: 'var(--bg-hover)',
                          border: '1px solid var(--border)',
                          color: 'var(--fg)',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                      />
                    </div>
                  ))}
                  <button
                    className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2 transition-opacity"
                    style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Map section */
            <MapSection />
          )}
        </div>

        {/* ── Right: Self-contained Sidebar ────────────────────── */}
        <ActionPanel onReportClick={() => setShowReportForm(true)} />
=======
    /**
     * Outer container — `flex-1` ensures this div expands to fill all
     * vertical space below the Navbar (which is rendered in layout.tsx).
     * `relative` is needed later for absolutely-positioned map overlays.
     */
    <div
      className="flex-1 flex items-center justify-center relative"
      style={{ background: "var(--bg)" }}
    >
      {/*
       * Placeholder content — visually confirms the design token system and
       * Navbar are working correctly.
       * Remove and replace with <MapSection /> in the map phase.
       */}
      <div
        className="text-center space-y-2 anim-fade-up"
        style={{ color: "var(--fg-muted)" }}
      >
        <p className="font-mono text-xs uppercase tracking-widest">
          Map & Dashboard
        </p>
        <p className="text-sm" style={{ color: "var(--fg)" }}>
          Content coming in the next phase
        </p>
>>>>>>> origin/UI/navbar
      </div>
    </div>
  )
}
