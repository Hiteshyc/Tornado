'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { OfficerAlert } from '../types'
import { SEVERITY_HEX, SEVERITY_LABEL } from '../types'

// Fix default icons for Leaflet in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
})

// Goan coordinates center
const GOA_CENTER: [number, number] = [15.2993, 74.1240]

// A component to automatically fit the map bounds to all active hubs
function BoundsFitter({ alerts }: { alerts: OfficerAlert[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (alerts.length > 0) {
      const allCoords = alerts.flatMap(a => (a.affectedHubs || []).map(h => [h.latitude, h.longitude] as [number, number]))
      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords)
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      }
    }
  }, [alerts, map])

  return null
}

export default function AlertMap({ alerts, hoveredAlertId }: { alerts: OfficerAlert[], hoveredAlertId?: string | null }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // Prevent SSR hydration mismatch

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-slate-200/20 z-0 bg-slate-100">
      <MapContainer
        center={GOA_CENTER}
        zoom={9}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {alerts.flatMap((alert) => {
          const color = SEVERITY_HEX[alert.severity] || '#666'
          const isHovered = hoveredAlertId === alert.id
          const isFaded = hoveredAlertId && !isHovered

          return (alert.affectedHubs || []).map(hub => {
            const radius = Math.max(hub.estimatedPopulation / 5, 2000) // Scale loosely based on hub population

            return (
              <Circle
                key={`${alert.id}-${hub.hubId}`}
                center={[hub.latitude, hub.longitude]}
                radius={radius}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isFaded ? 0.05 : (isHovered ? 0.6 : (alert.severity === 'critical' ? 0.4 : 0.2)),
                  weight: isFaded ? 1 : (isHovered ? 3 : (alert.severity === 'critical' ? 2 : 1))
                }}
              >
                <Popup className="custom-popup rounded-xl">
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                        {SEVERITY_LABEL[alert.severity]} (Priority {hub.priority})
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">{alert.title}</h3>
                    <p className="text-xs text-slate-500 mb-2">{hub.hubName}</p>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Hub Population</div>
                        <div className="text-xs font-mono font-medium text-slate-700">{(hub.estimatedPopulation / 1000).toFixed(1)}k</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Rescue Need</div>
                        <div className="text-xs font-mono font-medium text-slate-700">{hub.requiredRescueCapacity}</div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Circle>
            )
          })
        })}

        <BoundsFitter alerts={alerts} />
      </MapContainer>
    </div>
  )
}
