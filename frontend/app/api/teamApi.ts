import type { Team } from '../types'
import { fetchWithAuth } from '../libs/api'

const API_BASE = 'http://localhost:5000/api'

export async function fetchTeams(): Promise<Team[]> {
  const data = await fetchWithAuth(`${API_BASE}/teams`, {
    method: 'GET',
    credentials: 'include'
  })
  return data.teams || data
}

export async function sendMessage(teamId: string, message: string): Promise<void> {
  await fetchWithAuth(`${API_BASE}/teams/${teamId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message })
  })
}
