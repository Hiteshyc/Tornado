'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Team, TeamStatus } from '../types'
import { TEAM_STATUS_COLOR, TEAM_STATUS_LABEL } from '../data/officerData'

// Fix missing marker icons in React-Leaflet
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export default function TeamMap({ teams }: { teams: Team[] }) {
  const [mounted, setMounted] = useState(false)
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="w-full h-full bg-slate-900 animate-pulse rounded-b-xl border-x border-b border-slate-800" />

  // Center map around Goa roughly
  const center: [number, number] = [15.35, 73.95]

  return (
    <div className="w-full h-full min-h-[500px] rounded-b-xl border-x border-b overflow-hidden relative" style={{ borderColor: 'var(--border)' }}>
      <MapContainer 
        center={center} 
        zoom={10} 
        scrollWheelZoom={true} 
        style={{ height: '100%', minHeight: '500px', width: '100%', background: 'var(--bg-panel)' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {teams.map(team => {
          if (!team.gps || typeof team.gps.lat !== 'number') return null
          
          const color = TEAM_STATUS_COLOR[team.status]
          const icon = createIcon(color)
          
          return (
            <Marker 
              key={team._id} 
              position={[team.gps.lat, team.gps.lng]} 
              icon={icon}
              eventHandlers={{
                mouseover: () => setHoveredTeamId(team._id),
                mouseout: () => setHoveredTeamId(null)
              }}
            >
              <Tooltip permanent direction="right" offset={[10, 0]} className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg rounded p-2 text-slate-700 min-w-max transition-all">
                <div className="cursor-default">
                  <div className="text-xs font-bold text-slate-800">{team.name}</div>
                  
                  {/* Hover Details */}
                  {hoveredTeamId === team._id && (
                    <div className="font-sans mt-2 pt-2 border-t border-slate-200 min-w-32">
                      <div className="text-[10px] text-slate-500 mb-2">{team.leader} - {team.vehicle}</div>
                      <div className="text-[9px] px-2 py-1 rounded-full uppercase tracking-wider font-bold inline-block text-white" style={{ background: color }}>
                        {TEAM_STATUS_LABEL[team.status]}
                      </div>
                    </div>
                  )}
                </div>
              </Tooltip>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
