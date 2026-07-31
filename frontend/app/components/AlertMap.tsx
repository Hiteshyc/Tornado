'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { OfficerAlert } from '../data/officerData'
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

// A component to automatically fit the map bounds to all active alerts
function BoundsFitter({ alerts }: { alerts: OfficerAlert[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (alerts.length > 0) {
      const bounds = L.latLngBounds(alerts.map(a => [a.lat, a.lng]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    }
  }, [alerts, map])

  return null
}

export default function AlertMap({ alerts }: { alerts: OfficerAlert[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // Prevent SSR hydration mismatch

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-slate-200/20 z-0">
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

        {alerts.map((alert) => {
          const color = SEVERITY_HEX[alert.severity]
          const radius = Math.max(alert.population / 10, 2000) // Scale radius based on population loosely

          return (
            <Circle
              key={alert.id}
              center={[alert.lat, alert.lng]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: alert.severity === 'critical' ? 0.4 : 0.2,
                weight: alert.severity === 'critical' ? 2 : 1
              }}
            >
              <Popup className="custom-popup rounded-xl">
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                      {SEVERITY_LABEL[alert.severity]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm mb-1">{alert.title}</h3>
                  <p className="text-xs text-slate-500 mb-2">{alert.locationName}</p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Population</div>
                      <div className="text-xs font-mono font-medium text-slate-700">{(alert.population / 1000).toFixed(0)}k</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Wind</div>
                      <div className="text-xs font-mono font-medium text-slate-700">{alert.windSpeed} km/h</div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Circle>
          )
        })}

        <BoundsFitter alerts={alerts} />
      </MapContainer>
    </div>
  )
}
