"use client";

import { MapPin } from "lucide-react";
import type { LocationState } from "../types";
import { SEVERITY_HEX, SEVERITY_LABEL } from "../types";

interface CurrentLocationWidgetProps {
  location: LocationState;
}

/**
 * CurrentLocationWidget
 *
 * Renders a floating box in the bottom-right of the map showing
 * the user's currently focused location, raw GPS coordinates,
 * and the active alert severity rating.
 */
export default function CurrentLocationWidget({ location }: CurrentLocationWidgetProps) {
  const color = SEVERITY_HEX[location.status] || "var(--accent)";
  const label = SEVERITY_LABEL[location.status] || "Unknown";

  return (
    <div
      className="absolute bottom-4 right-4 z-[500] flex items-center gap-2.5 px-3 py-2 rounded-xl animate-fade-up"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Blinking Location Icon Indicator */}
      <div className="relative flex items-center justify-center w-6 h-6">
        <div
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{ background: color, opacity: 0.3 }}
        />
        <MapPin size={14} style={{ color }} />
      </div>

      {/* Info details */}
      <div>
        <div className="text-xs font-semibold leading-none" style={{ color: "var(--fg)" }}>
          {location.name}
        </div>
        <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--fg-muted)" }}>
          {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E
        </div>
      </div>

      {/* Active Severity Badge */}
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase"
        style={{ background: color + "18", color, border: `1px solid ${color}30` }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: color }} />
        {label}
      </div>
    </div>
  );
}
