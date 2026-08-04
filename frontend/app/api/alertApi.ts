import type { OfficerAlert } from '../types'

const API_BASE = 'http://localhost:5000/api'

export async function fetchAlerts(): Promise<OfficerAlert[]> {
  const res = await fetch(`${API_BASE}/alerts`, {
    credentials: 'include'
  })
  if (!res.ok) {
    throw new Error('Failed to fetch alerts')
  }
  const data = await res.json()
  return data.alerts
}

export async function resolveAlert(alertId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
  if (!res.ok) {
    throw new Error('Failed to resolve alert')
  }
}
