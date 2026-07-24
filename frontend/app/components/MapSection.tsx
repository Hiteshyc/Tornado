/**
 * MapSection — Placeholder for the interactive map.
 * Replace the inner content with the actual Leaflet/Mapbox integration.
 */
export default function MapSection() {
  return (
    <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Map placeholder grid ──────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: 0.4,
        }}
      />

      {/* ── Simulated coastline ───────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.12 }}
      >
        <path
          d="M0,300 Q100,250 200,280 Q300,310 350,260 Q400,210 500,240 Q600,270 700,220 Q750,200 800,210 L800,600 L0,600 Z"
          fill="var(--primary)"
        />
        <path
          d="M0,320 Q80,290 180,305 Q280,320 340,280 Q390,250 480,265 Q580,280 680,240 Q740,218 800,228"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
        />
      </svg>

      {/* ── Placeholder content ───────────────────────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
        <div
          className="px-6 py-4 rounded-2xl text-center"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="text-3xl mb-2">🗺️</div>
          <div className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>
            Interactive Map
          </div>
          <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
            Leaflet / Mapbox integration goes here
          </div>
        </div>
      </div>

      {/* ── Simulated hazard markers ──────────────────────────── */}
      {[
        { x: '30%', y: '40%', color: '#dc2626', size: 12 },
        { x: '55%', y: '30%', color: '#9333ea', size: 16 },
        { x: '70%', y: '55%', color: '#ea580c', size: 10 },
        { x: '20%', y: '60%', color: '#ca8a04', size: 8  },
        { x: '80%', y: '35%', color: '#16a34a', size: 9  },
      ].map((m, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: m.x,
            top: m.y,
            width: m.size,
            height: m.size,
            background: m.color,
            boxShadow: `0 0 0 3px ${m.color}30`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  )
}
