"use client";

import { useState } from 'react'
import dynamic from "next/dynamic";
import { useTheme } from './context/ThemeContext';
import type { LocationState } from './types';
import ActionPanel from './components/ActionPanel'

const MapSection = dynamic(() => import("./components/MapSection"), { ssr: false });

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
  const { theme } = useTheme();
  
  const [currentLocation, setCurrentLocation] = useState<LocationState>({
    name: "India Summary",
    lat: 20.5937,
    lng: 78.9629,
    status: "safe",
  });

  return (
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
            <MapSection
              theme={theme}
              currentLocation={currentLocation}
              onLocationChange={setCurrentLocation}
            />
          )}
        </div>

        {/* ── Right: Self-contained Sidebar ────────────────────── */}
        <ActionPanel onReportClick={() => setShowReportForm(true)} />
      </div>
    </div>
  )
}
