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
  eta: number
  affectedHubs: Array<{ hubName: string; latitude: number; longitude: number; [key: string]: any }>
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

export interface LocationState {
  name: string
  lat: number
  lng: number
  status: Severity
}

// ── Team ────────────────────────────────────────────────────
export type TeamStatus = 'available' | 'on-mission' | 'travelling' | 'offline'
export type VehicleType = 'Rescue Boat' | 'Fire Truck' | 'Helicopter' | 'Amphibious Vehicle' | 'Ambulance'

export interface TeamMember {
  name: string
  role: string
  _id?: string
}

export interface Team {
  _id: string
  id?: string
  name: string
  leader: string
  vehicle: VehicleType
  status: TeamStatus
  hub: string
  members: TeamMember[]
  equipment: string[]
  gps: { lat: number; lng: number; label: string }
  missionStatus: string
  previousMission: string
  assignedDeploymentId?: string
}
