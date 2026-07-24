'use client'

/**
 * ActionPanel — Self-contained right sidebar.
 *
 * Import this single component to get the entire sidebar system:
 *   - Main panel (Report Hazard, Active Alerts, Safety Guide, Announcements)
 *   - Safety Guide sub-panel + animated dual-pane drawer with Do's & Don'ts
 *   - Govt. Announcements sub-panel + animated dual-pane drawer with full text
 *   - Active Alerts redirects to /alerts page (internally)
 *
 * Props:
 *   onReportClick — called when user clicks "Report Hazard"; parent shows the form.
 */

import { useState } from 'react'
import type { SafetyGuide, Announcement, SidebarView } from '../types'
import MainPanel from './sidebar/MainPanel'
import SafetyGuidePanel from './sidebar/SafetyGuidePanel'
import SafetyGuideDrawer from './sidebar/SafetyGuideDrawer'
import AnnouncementsPanel from './sidebar/AnnouncementsPanel'
import AnnouncementDrawer from './sidebar/AnnouncementDrawer'

interface ActionPanelProps {
  /** Called when user clicks "Report Hazard" — parent decides where to render the form */
  onReportClick: () => void
}

export default function ActionPanel({ onReportClick }: ActionPanelProps) {
  // ── Primary sidebar view ─────────────────────────────────────
  const [sidebarView, setSidebarView] = useState<SidebarView>('main')

  // ── Drawer state ─────────────────────────────────────────────
  const [selectedGuide, setSelectedGuide] = useState<SafetyGuide | null>(null)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

  const isDrawerOpen = selectedGuide !== null || selectedAnnouncement !== null

  // ── Handlers ──────────────────────────────────────────────────
  const handleSelectGuide = (guide: SafetyGuide) => {
    setSelectedAnnouncement(null) // close any open announcement drawer
    setSelectedGuide(guide)
  }

  const handleSelectAnnouncement = (ann: Announcement) => {
    setSelectedGuide(null) // close any open guide drawer
    setSelectedAnnouncement(ann)
  }

  const handleCollapseDrawer = () => {
    setSelectedGuide(null)
    setSelectedAnnouncement(null)
  }

  const handleNavigate = (view: SidebarView) => {
    handleCollapseDrawer() // always close drawer when switching views
    setSidebarView(view)
  }

  const handleBack = () => {
    handleCollapseDrawer()
    setSidebarView('main')
  }

  return (
    <div
      className="flex flex-row-reverse shrink-0 border-l overflow-hidden"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* ── Primary sidebar panel ─────────────────────────────── */}
      <div
        className="flex flex-col shrink-0 overflow-hidden"
        style={{
          width: 'var(--panel-w)',
          background: 'var(--bg-panel)',
        }}
      >
        {sidebarView === 'main' && (
          <MainPanel onNavigate={handleNavigate} onReportClick={onReportClick} />
        )}
        {sidebarView === 'safety' && (
          <SafetyGuidePanel onBack={handleBack} onSelectGuide={handleSelectGuide} />
        )}
        {sidebarView === 'announcements' && (
          <AnnouncementsPanel onBack={handleBack} onSelectAnnouncement={handleSelectAnnouncement} />
        )}
      </div>

      {/* ── Extended drawer panel (slides in from right, pushes left) ── */}
      <div className={`sidebar-drawer ${isDrawerOpen ? 'open' : ''}`}>
        {selectedGuide && (
          <SafetyGuideDrawer guide={selectedGuide} onCollapse={handleCollapseDrawer} />
        )}
        {selectedAnnouncement && (
          <AnnouncementDrawer announcement={selectedAnnouncement} onCollapse={handleCollapseDrawer} />
        )}
      </div>
    </div>
  )
}
