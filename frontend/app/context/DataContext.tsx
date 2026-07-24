'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Alert, Announcement, SafetyGuide, SituationStatus } from '../types'
import { getAlerts, getAnnouncements, getSafetyGuides } from '../libs/api'

interface DataContextType {
  alerts: Alert[]
  announcements: Announcement[]
  safetyGuides: SafetyGuide[]
  currentSituation: SituationStatus
  loading: boolean
  error: string | null
  refreshAll: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch (e) {
    return 'Recently'
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [safetyGuides, setSafetyGuides] = useState<SafetyGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshAll = async () => {
    try {
      setLoading(true)
      const [rawAlerts, rawAnnouncements, rawSafetyGuides] = await Promise.all([
        getAlerts(),
        getAnnouncements(),
        getSafetyGuides(),
      ])

      // Map rawAlerts to Alert[]
      const alertsList = rawAlerts?.alerts || []
      const mappedAlerts: Alert[] = alertsList.map((a: any) => ({
        id: a._id,
        title: a.title,
        severity: a.severity,
        location: a.location,
        lat: a.coordinates?.coordinates?.[1] ?? 0,
        lng: a.coordinates?.coordinates?.[0] ?? 0,
        expectedHours: a.expectedHours,
        action: a.action,
        timestamp: formatRelativeTime(a.createdAt),
        distance: 8,
      }))

      // Map rawAnnouncements to Announcement[]
      const announcementsList = rawAnnouncements?.announcements || []
      const mappedAnnouncements: Announcement[] = announcementsList.map((ann: any) => ({
        id: ann._id,
        agency: ann.agency,
        badge: ann.badge,
        title: ann.title,
        body: ann.body,
        priority: ann.priority || 'moderate',
        timestamp: new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))

      // Safety guides matches directly
      const guidesList = rawSafetyGuides?.guides || []
      const mappedSafetyGuides: SafetyGuide[] = guidesList.map((g: any) => ({
        key: g.key,
        title: g.title,
        icon: g.icon,
        dos: g.dos,
        donts: g.donts,
      }))

      setAlerts(mappedAlerts)
      setAnnouncements(mappedAnnouncements)
      setSafetyGuides(mappedSafetyGuides)
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to fetch data from the database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAll()
  }, [])

  // Calculate current situation from alerts
  const currentSituation: SituationStatus = alerts.length > 0
    ? {
        status: alerts[0].severity,
        title: `${alerts[0].severity.toUpperCase()} ALERT ACTIVE`,
        description: `${alerts[0].title} — Expected in ${alerts[0].expectedHours}h`,
      }
    : {
        status: 'safe',
        title: 'ALL CLEAR',
        description: 'No active hazards in your region',
      }

  return (
    <DataContext.Provider value={{ alerts, announcements, safetyGuides, currentSituation, loading, error, refreshAll }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
