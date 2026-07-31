import type { Team } from '../types'

const API_BASE = 'http://localhost:5000/api'

export async function fetchTeams(): Promise<Team[]> {
  const res = await fetch(`${API_BASE}/teams`, {
    credentials: 'include'
  })
  if (!res.ok) {
    throw new Error('Failed to fetch teams')
  }
  return res.json()
}

export async function sendMessage(teamId: string, message: string): Promise<void> {
  const res = await fetch(`${API_BASE}/teams/${teamId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message })
  })
  if (!res.ok) {
    throw new Error('Failed to send message')
  }
}
