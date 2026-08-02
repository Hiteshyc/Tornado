'use client'

import { useEffect } from 'react'
import { io } from 'socket.io-client'

export function SocketNotifications() {
  useEffect(() => {
    // Request permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const socket = io('http://localhost:5000')

    // Listen for team level updates (e.g., from /team-management)
    socket.on('team_updated', (updatedTeam: any) => {
      if (updatedTeam.status === 'offline' && Notification.permission === 'granted') {
        new Notification('Team Offline', {
          body: `Team ${updatedTeam.name} has lost connectivity or went offline.`,
          icon: '/favicon.ico'
        })
      }
    })

    // Listen for bulk team updates (e.g., from /deployments)
    socket.on('teams_updated', (data: { teamIds: string[]; status: string }) => {
      if (data.status === 'offline' && Notification.permission === 'granted') {
        new Notification('Teams Offline', {
          body: `Multiple teams have gone offline.`,
          icon: '/favicon.ico'
        })
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return null // Silent component
}
