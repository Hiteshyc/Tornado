"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Plus, Minus, Crosshair, X, Wind, Droplets, Clock, Navigation } from "lucide-react";
import type { Severity, LocationState } from "../types";
import type { Theme } from "../context/ThemeContext";
import { SEVERITY_HEX, SEVERITY_LABEL } from "../types";
import { coastalLocations } from "../constants/locations";
import { getNationalAlerts } from "../libs/api";
import { useAuth } from "../context/AuthContext";
import WeatherWidget from "./WeatherWidget";
import CurrentLocationWidget from "./CurrentLocationWidget";

interface MapSectionProps {
  theme: Theme;
  onLocationChange?: (loc: LocationState) => void;
  currentLocation: LocationState;
}

// ── Client-side Distance Calculation (Haversine Formula) ───────────────────
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Map Controller — handles external flyTo pans ───────────────────────────
function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  mapRef.current = map;
  return null;
}

// ── Map Auto Scaler — dynamically fits bounds to show all alerts (guest) ────
function MapAutoScaler({ alerts, isGuest }: { alerts: any[]; isGuest: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (isGuest && alerts && alerts.length > 0) {
      const points = alerts.flatMap((a) => (a.affectedHubs || []).map(h => [h.latitude, h.longitude] as L.LatLngTuple));
      if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      }
    }
  }, [alerts, isGuest, map]);
  return null;
}

// ── Hazard popup details ───────────────────────────────────────────────────
function HazardPopup({ h }: { h: any }) {
  const color = SEVERITY_HEX[h.severity as Severity] || "var(--accent)";
  const label = SEVERITY_LABEL[h.severity as Severity] || "Unknown";
  
  return (
    <div className="w-64 text-sm" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header bar */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: color + "18", borderBottom: `2px solid ${color}` }}
      >
        <div>
          <div className="font-semibold text-sm" style={{ color: "var(--fg)" }}>{h.title}</div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--fg-muted)" }}>
            Hazard Event
          </div>
        </div>
        <div
          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase"
          style={{ background: color + "22", color, border: `1px solid ${color}40` }}
        >
          {label}
        </div>
      </div>

      {/* Details */}
      <div className="px-3 py-2.5 space-y-1.5" style={{ background: "var(--bg-card)" }}>
        <div className="grid grid-cols-2 gap-2">
          <Stat icon={Clock} label="Expected In" value={`${h.eta || 0}h`} color={color} />
          <Stat icon={Navigation} label="Distance" value={h.distance ? `${h.distance.toFixed(1)} km` : "N/A"} color={color} />
        </div>

        <div
          className="mt-2 px-2 py-1.5 rounded-lg text-[11px] font-medium"
          style={{ background: color + "14", color }}
        >
          ⚠️ {h.action}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={11} style={{ color }} />
      <div>
        <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{label}</div>
        <div className="text-xs font-mono font-semibold" style={{ color: "var(--fg)" }}>{value}</div>
      </div>
    </div>
  );
}

// ── Pulsing Marker Icon Factory ────────────────────────────────────────────
function createMarkerIcon(severity: Severity, isOutside: boolean): L.DivIcon {
  const color = SEVERITY_HEX[severity] || "var(--accent)";
  const isPulsing = (severity === "high" || severity === "critical") && !isOutside;
  const size = isPulsing ? 36 : 22;
  const opacity = isOutside ? 0.45 : 1.0;

  const rings = isPulsing
    ? `<div class="marker-ring" style="color:${color};border-color:${color}"></div>
       <div class="marker-ring marker-ring-2" style="color:${color};border-color:${color}"></div>`
    : "";

  const dot = `<div style="
    width:${isPulsing ? 14 : 16}px;
    height:${isPulsing ? 14 : 16}px;
    border-radius:50%;
    background:${color};
    border: 2.5px solid rgba(255,255,255,0.9);
    box-shadow: 0 2px 8px ${color}66;
    position:relative;z-index:1;
  "></div>`;

  const html = `<div style="
    position:relative;
    width:${size}px;height:${size}px;
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;
    opacity:${opacity};
  ">${rings}${dot}</div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

// Create custom marker for the user's home location
function createHomeIcon(): L.DivIcon {
  const html = `<div style="
    position:relative;
    width:22px;height:22px;
    display:flex;align-items:center;justify-content:center;
  ">
    <div style="
      width:14px;
      height:14px;
      border-radius:50%;
      background:#1d4ed8;
      border: 2.5px solid white;
      box-shadow: 0 0 10px rgba(29, 78, 216, 0.6);
    "></div>
  </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MapSection({ theme, onLocationChange, currentLocation }: MapSectionProps) {
  const mapRef = useRef<L.Map | null>(null);
  const { user } = useAuth();
  
  const [alerts, setAlerts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<typeof coastalLocations>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState(50); // Default search radius in km
  
  // Custom user coordinates state
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);


  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  // ── Load Alerts & Center Coordinates based on Auth State ──────────────────
  useEffect(() => {
    async function loadMapData() {
      if (!user || !user.isOnboarded) {
        // 1. Guest or Registered-but-not-onboarded flow: Fetch all alerts nationally and reset user coords
        setUserCoords(null);
        try {
          const res = await getNationalAlerts();
          if (res && res.success) {
            setAlerts(res.alerts || []);
          }
        } catch (err) {
          console.error("Failed to load national alerts: ", err);
        }
      } else {
        // 2. Onboarded User flow: Resolve active coordinates
        // DB fallback coordinates (only use if valid — not [0,0])
        const dbCoords = user.location?.coordinates;
        const hasValidDbCoords =
          Array.isArray(dbCoords) &&
          dbCoords.length === 2 &&
          (dbCoords[0] !== 0 || dbCoords[1] !== 0);

        let lat = 20.5937; // Default India center coords
        let lng = 78.9629;
        if (hasValidDbCoords) {
          lng = dbCoords[0];
          lat = dbCoords[1];
        }

        let resolvedViaGPS = false;
        const resolveUserCoordinates = () => {
          return new Promise<[number, number]>((resolve) => {
            if (user.locationConsent && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  resolvedViaGPS = true;
                  resolve([pos.coords.latitude, pos.coords.longitude]);
                },
                () => resolve([lat, lng])
              );
            } else {
              resolve([lat, lng]);
            }
          });
        };

        const [userLat, userLng] = await resolveUserCoordinates();
        setUserCoords([userLat, userLng]);

        // Center map to user's coordinates
        if (mapRef.current) {
          mapRef.current.setView([userLat, userLng], 10);
        }

        // Build location name — use GPS label when GPS resolved, DB address otherwise
        const locationName = resolvedViaGPS
          ? "Your Location"
          : user.address?.city
          ? `${user.address.city}${
              user.address.state ? ", " + user.address.state : ""
            }`
          : "Your Locality";

        if (onLocationChange) {
          onLocationChange({
            name: locationName,
            lat: userLat,
            lng: userLng,
            status: "safe",
          });
        }

        // Fetch all active alerts (national scale)
        try {
          const res = await getNationalAlerts();
          if (res && res.success) {
            setAlerts(res.alerts || []);
          }
        } catch (err) {
          console.error("Failed to load national alerts: ", err);
        }
      }
    }

    loadMapData();
  }, [user, radius, onLocationChange]);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length > 2) {
      try {
        // Query via the Next.js server-side proxy (avoids CORS with Nominatim)
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(q)}`
        );
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setSearchResults(
            data.map((item: any) => ({
              id: item.place_id,
              name: item.display_name.split(",").slice(0, 3).join(","),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            }))
          );
        } else {
          setSearchResults(
            coastalLocations.filter((l) => l.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
          );
        }
      } catch (err) {
        console.error("OSM Geocoding search failed, falling back to local dataset: ", err);
        setSearchResults(
          coastalLocations.filter((l) => l.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
        );
      }
    } else if (q.length > 0) {
      setSearchResults(
        coastalLocations.filter((l) => l.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
      );
    } else {
      setSearchResults([]);
    }
  };

  const flyTo = useCallback((lat: number, lng: number, name: string) => {
    mapRef.current?.flyTo([lat, lng], 11, { duration: 1.5 });
    
    if (onLocationChange) {
      onLocationChange({ name, lat, lng, status: "safe" });
    }
    
    setSearch(name);
    setSearchResults([]);
    setShowSearch(false);
  }, [onLocationChange]);

  const handleLocateMe = () => {
    setLocating(true);

    const fallbackToDB = () => {
      const dbCoords = user?.location?.coordinates;
      const hasValidDbCoords =
        Array.isArray(dbCoords) &&
        dbCoords.length === 2 &&
        (dbCoords[0] !== 0 || dbCoords[1] !== 0);

      if (hasValidDbCoords) {
        const lng = dbCoords[0];
        const lat = dbCoords[1];
        mapRef.current?.flyTo([lat, lng], 11, { duration: 1.5 });
        setUserCoords([lat, lng]);
        
        if (onLocationChange) {
          const name = user?.address?.city
            ? `${user.address.city}${user.address.state ? ", " + user.address.state : ""}`
            : "Your Locality";
          onLocationChange({ name, lat, lng, status: "safe" });
        }
      }
      setLocating(false);
    };

    if (user?.locationConsent && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          mapRef.current?.flyTo([lat, lng], 11, { duration: 1.5 });
          setUserCoords([lat, lng]);
          if (onLocationChange) {
            onLocationChange({ name: "Your Location", lat, lng, status: "safe" });
          }
          setLocating(false);
        },
        fallbackToDB,
        { timeout: 8000 }
      );
    } else {
      fallbackToDB();
    }
  };

  return (
    <div className="flex-1 relative overflow-hidden w-full h-full min-h-[400px]">
      {/* ── Map Toolbar ─────────────────────────────────── */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-1.5 px-2 py-1.5 rounded-xl animate-fade-up"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Search Input */}
        <div className="relative">
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all duration-200"
            style={{ background: showSearch ? "var(--bg-hover)" : "transparent" }}
          >
            <Search size={13} style={{ color: "var(--fg-muted)" }} />
            <input
              type="text"
              placeholder="Search location..."
              value={search}
              onFocus={() => setShowSearch(true)}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent outline-none text-xs placeholder:text-[var(--fg-muted)] w-36"
              style={{ color: "var(--fg)", fontFamily: "var(--font-sans)" }}
            />
            {search && (
              <button onClick={() => { setSearch(""); setSearchResults([]); }} className="cursor-pointer">
                <X size={11} style={{ color: "var(--fg-muted)" }} />
              </button>
            )}
          </div>

          {/* Autocomplete Results */}
          {searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 mt-1 w-56 rounded-xl overflow-hidden animate-scale-up z-10"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              {searchResults.map((loc, idx) => (
                <button
                  key={(loc as any).id || `${loc.name}-${idx}`}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors cursor-pointer"
                  style={{ color: "var(--fg)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => flyTo(loc.lat, loc.lng, loc.name)}
                >
                  <span style={{ color: "var(--primary)" }}>📍</span>
                  {loc.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5" style={{ background: "var(--border)" }} />

        {/* Zoom Controls */}
        <MapButton onClick={() => mapRef.current?.zoomIn()} title="Zoom In">
          <Plus size={14} />
        </MapButton>
        <MapButton onClick={() => mapRef.current?.zoomOut()} title="Zoom Out">
          <Minus size={14} />
        </MapButton>

        {/* Divider */}
        <div className="w-px h-5" style={{ background: "var(--border)" }} />

        {/* Locate Me */}
        <MapButton onClick={handleLocateMe} title="Locate Me" active={locating}>
          <Crosshair size={14} className={locating ? "animate-blink" : ""} />
        </MapButton>
      </div>

      {/* ── Weather Widget (Top Left) ───────────────────── */}
      <WeatherWidget
        lat={user ? currentLocation.lat : 28.6139}
        lng={user ? currentLocation.lng : 77.2090}
        locationName={user ? currentLocation.name : "New Delhi"}
      />

      {/* ── Geofence Radius Selector (Only for Logged-In) ── */}
      {user && userCoords && (
        <div
          className="absolute bottom-20 left-4 z-[500] flex flex-col p-2.5 rounded-xl animate-fade-up"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <span className="text-[9px] font-mono uppercase tracking-widest opacity-60 mb-1">
            Geofence Radius: {radius} km
          </span>
          <input
            type="range"
            min="10"
            max="150"
            step="10"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-36 accent-blue-500 cursor-pointer"
          />
        </div>
      )}

      {/* ── Leaflet Map Container ───────────────────────── */}
      <MapContainer
        center={[currentLocation.lat, currentLocation.lng]}
        zoom={currentLocation.name === "India Summary" ? 5 : 10}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        attributionControl={true}
      >
        <MapController mapRef={mapRef} />
        <MapAutoScaler alerts={alerts} isGuest={!user} />

        <TileLayer
          key={tileUrl}
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        {/* Render User's Local Geofence Circle Overlay */}
        {userCoords && (
          <>
            <Circle
              center={userCoords}
              radius={radius * 1000} // in meters
              pathOptions={{
                color: "#1d4ed8",
                fillColor: "#1d4ed8",
                fillOpacity: 0.05,
                weight: 1.5,
                dashArray: "4, 6",
              }}
            />
            <Marker position={userCoords} icon={createHomeIcon()}>
              <Popup>
                <div className="text-xs font-semibold">Your Location</div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Render Active Hazards */}
        {alerts.flatMap((h) => {
          return (h.affectedHubs || []).map((hub: any, idx: number) => {
            const lat = hub.latitude;
            const lng = hub.longitude;
            const distance = userCoords
              ? getDistance(userCoords[0], userCoords[1], lat, lng)
              : null;
            const isOutside = distance !== null && distance > radius;
            const updatedAlert = { ...h, distance };

            return (
              <Marker
                key={`${h.id}-${idx}`}
                position={[lat, lng]}
                icon={createMarkerIcon(h.severity, isOutside)}
                eventHandlers={{
                  mouseover: (e) => {
                    e.target.openPopup();
                  },
                  mouseout: (e) => {
                    e.target.closePopup();
                  },
                }}
              >
                <Popup maxWidth={280} minWidth={260}>
                  <HazardPopup h={updatedAlert} />
                </Popup>
              </Marker>
            );
          });
        })}
      </MapContainer>

      {/* ── Current Location Widget (Bottom Right) ──────── */}
      <CurrentLocationWidget location={currentLocation} />

      {/* Map Legend (Bottom Left) */}
      <div
        className="absolute bottom-4 left-4 z-[500] px-2.5 py-2 rounded-xl"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="text-[9px] uppercase tracking-widest font-mono mb-1.5" style={{ color: "var(--fg-muted)" }}>
          Severity Legend
        </div>
        <div className="flex items-center gap-2">
          {(["safe", "low", "moderate", "high", "critical"] as Severity[]).map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: SEVERITY_HEX[s] }} />
              <span className="text-[9px] font-mono capitalize" style={{ color: "var(--fg-muted)" }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapButton({
  onClick, title, active, children
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer"
      style={{
        color: active ? "var(--primary)" : "var(--fg-muted)",
        background: "transparent",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}
