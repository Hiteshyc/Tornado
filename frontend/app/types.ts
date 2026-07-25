// ─── Severity ────────────────────────────────────────────────────────────────
export type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'safe'

export const SEVERITY_HEX: Record<Severity, string> = {
  critical: '#9333ea',
  high: '#dc2626',
  moderate: '#ea580c',
  low: '#ca8a04',
  safe: '#16a34a',
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  safe: 'Safe',
}

// ─── Sidebar View State ───────────────────────────────────────────────────────
export type SidebarView = 'main' | 'safety' | 'announcements'
export type DrawerContent = 'safety_detail' | 'announcement_detail' | null

// ─── Data Models ──────────────────────────────────────────────────────────────
export interface Alert {
  id: number
  title: string
  severity: Severity
  locationName: string
  location?: string | { type?: string; coordinates?: number[] }
  lat: number
  lng: number
  expectedHours: number
  action: string
  timestamp: string
  distance?: number
}

export interface Announcement {
  id: number
  agency: string
  badge: string
  title: string
  body: string
  priority: Severity
  timestamp: string
}

export interface SafetyGuide {
  key: string
  title: string
  icon: string
  dos: string[]
  donts: string[]
}

export interface SituationStatus {
  status: Severity
  title: string
  description: string
}
