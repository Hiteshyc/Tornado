"use client";

import { useState } from 'react';
import dynamic from "next/dynamic";
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import type { LocationState } from './types';
import ActionPanel from './components/ActionPanel';
import ReportModal from './components/ReportModal';

const MapSection = dynamic(() => import("./components/MapSection"), { ssr: false });

/**
 * Main landing page
 *
 * Layout:
 *   [Map Section] | [Right Sidebar (ActionPanel)]
 *
 * Clicking "Report Hazard" in ActionPanel opens the full ReportModal.
 */
export default function Home() {
  const [showReportForm, setShowReportForm] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [currentLocation, setCurrentLocation] = useState<LocationState>({
    name: "India Summary",
    lat: 20.5937,
    lng: 78.9629,
    status: "safe",
  });

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Main content row ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Map section ─────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          <MapSection
            theme={theme}
            currentLocation={currentLocation}
            onLocationChange={setCurrentLocation}
          />
        </div>

        {/* ── Right: Self-contained Sidebar ────────────────────── */}
        <ActionPanel onReportClick={() => setShowReportForm(true)} />
      </div>

      {/* ── Full Incident Report Modal ────────────────────────────── */}
      <ReportModal
        isOpen={showReportForm}
        onClose={() => setShowReportForm(false)}
        currentUser={user as any}
      />
    </div>
  );
}
