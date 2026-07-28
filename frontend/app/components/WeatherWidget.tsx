"use client";

import { useState, useEffect } from "react";
import { Wind, Droplets, Thermometer, Eye, ChevronDown, X, Loader } from "lucide-react";

interface WeatherWidgetProps {
  lat: number | null;
  lng: number | null;
  locationName: string;
}

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  feelsLike: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  location: string;
}

// Helper to map WMO Weather Interpretation Codes to friendly text and icons
function mapWeatherCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: "Clear Sky", icon: "☀️" };
  if ([1, 2, 3].includes(code)) return { condition: "Partly Cloudy", icon: "⛅" };
  if ([45, 48].includes(code)) return { condition: "Foggy", icon: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) return { condition: "Drizzle", icon: "🌧️" };
  if ([61, 63, 65, 66, 67].includes(code)) return { condition: "Rainy", icon: "🌧️" };
  if ([71, 73, 75, 77].includes(code)) return { condition: "Snowy", icon: "❄️" };
  if ([80, 81, 82, 85, 86].includes(code)) return { condition: "Rain Showers", icon: "🌦️" };
  if ([95, 96, 99].includes(code)) return { condition: "Thunderstorm", icon: "🌩️" };
  return { condition: "Moderate Weather", icon: "🌤️" };
}

/**
 * WeatherWidget
 *
 * Dynamically queries the Open-Meteo API when coordinate props change.
 * Renders blank (null) for unauthenticated/guest visits.
 */
export default function WeatherWidget({ lat, lng, locationName }: WeatherWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (lat === null || lng === null) {
      setWeatherData(null);
      return;
    }

    async function fetchWeather() {
      setLoading(true);
      setError(false);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,visibility`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Weather request failed");
        
        const data = await res.json();
        const current = data.current || {};
        const { condition, icon } = mapWeatherCode(current.weather_code || 0);

        setWeatherData({
          temp: Math.round(current.temperature_2m ?? 0),
          humidity: current.relative_humidity_2m ?? 0,
          windSpeed: Math.round(current.wind_speed_10m ?? 0),
          condition,
          icon,
          feelsLike: Math.round(current.apparent_temperature ?? 0),
          pressure: Math.round(current.surface_pressure ?? 1013),
          visibility: (current.visibility ?? 10000) / 1000, // convert meters to km
          uvIndex: 4, // Default fallback
          location: locationName.split(",")[0],
        });
      } catch (err) {
        console.error("Open-Meteo fetch failed: ", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [lat, lng, locationName]);

  // Return blank (hidden) if not logged in or coordinates are absent
  if (lat === null || lng === null) {
    return null;
  }

  // Loading indicator overlay on widget
  if (loading && !weatherData) {
    return (
      <div className="absolute top-3 left-3 z-[500] flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <Loader size={12} className="animate-spin" />
        <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Loading Weather...</span>
      </div>
    );
  }

  if (error || !weatherData) {
    return null; // Silent hide on weather API failure
  }

  const hasHighWind = weatherData.windSpeed > 50;

  if (expanded) {
    return (
      <div
        className="absolute top-3 left-3 z-[500] rounded-xl overflow-hidden animate-scale-up"
        style={{
          width: 260,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ borderColor: "var(--border)", background: "#1a5fc408" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{weatherData.icon}</span>
            <div>
              <div className="text-xs font-semibold leading-none" style={{ color: "var(--fg)" }}>
                {weatherData.condition}
              </div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--fg-muted)" }}>
                {weatherData.location}
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{ color: "var(--fg-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X size={12} />
          </button>
        </div>

        {/* Temperature Details */}
        <div className="px-3 py-3 flex items-end justify-between border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-4xl font-light tracking-tight" style={{ color: "var(--fg)" }}>
              {weatherData.temp}°<span className="text-2xl">C</span>
            </div>
            <div className="text-[10px] font-mono mt-1" style={{ color: "var(--fg-muted)" }}>
              Feels like {weatherData.feelsLike}°C
            </div>
          </div>
          {hasHighWind && (
            <div
              className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase"
              style={{ background: "#dc262618", color: "#dc2626", border: "1px solid #dc262630" }}
            >
              ⚠️ High Wind
            </div>
          )}
        </div>

        {/* Secondary Parameters Grid */}
        <div className="grid grid-cols-2 gap-px" style={{ background: "var(--border)" }}>
          {[
            { icon: Wind, label: "Wind Speed", value: `${weatherData.windSpeed} km/h`, warn: hasHighWind },
            { icon: Droplets, label: "Humidity", value: `${weatherData.humidity}%`, warn: false },
            { icon: Thermometer, label: "Pressure", value: `${weatherData.pressure} hPa`, warn: weatherData.pressure < 1000 },
            { icon: Eye, label: "Visibility", value: `${weatherData.visibility} km`, warn: weatherData.visibility < 5 },
          ].map(({ icon: Icon, label, value, warn }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2.5" style={{ background: "var(--bg-card)" }}>
              <Icon size={13} style={{ color: warn ? "#dc2626" : "var(--fg-muted)" }} />
              <div>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{label}</div>
                <div className="text-xs font-mono font-medium mt-0.5" style={{ color: warn ? "#dc2626" : "var(--fg)" }}>
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Compact toggle widget view
  return (
    <button
      onClick={() => setExpanded(true)}
      className="absolute top-3 left-3 z-[500] flex items-center gap-2 px-3 py-2 rounded-xl animate-fade-up transition-all duration-200 group cursor-pointer"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
        backdropFilter: "blur(12px)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-lg)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow)")}
    >
      <span className="text-xl">{weatherData.icon}</span>
      <div className="text-left">
        <div className="flex items-baseline gap-1">
          <span className="text-base font-semibold leading-none" style={{ color: "var(--fg)" }}>
            {weatherData.temp}°C
          </span>
          <span className="text-[10px] font-mono font-bold" style={{ color: hasHighWind ? "#dc2626" : "var(--fg-muted)" }}>
            {weatherData.windSpeed}km/h {hasHighWind ? "↑" : ""}
          </span>
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: "var(--fg-muted)" }}>
          {weatherData.condition}
        </div>
      </div>
      <ChevronDown
        size={12}
        className="transition-transform group-hover:rotate-180 duration-300"
        style={{ color: "var(--fg-muted)" }}
      />
    </button>
  );
}
