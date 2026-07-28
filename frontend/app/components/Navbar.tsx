"use client";

/**
 * Navbar.tsx
 *
 * Application-wide top navigation bar.
 *
 * Layout (left → centre → right):
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  [Shield] NDMA   │  Coastal Hazard Prevention / subtitle   │  [Alert] [☀/🌙] [Avatar ▾]  │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Role-aware behaviour:
 *   - guest   → dropdown shows Register / Login / About / Help
 *   - user    → dropdown shows Profile / My Reports / Settings / Logout
 *   - officer → dropdown shows Profile / Assigned Alerts / Verify Reports / Settings / Logout
 *   - admin   → dropdown shows Dashboard / User Management / Analytics / System Settings / Logout
 *
 * Husk phase notes:
 *   - "Login" in the guest dropdown opens <AuthModal />.
 *   - "Logout" calls the AuthContext logout() stub (clears local state only).
 *   - Alert badge count is static ("2 Critical Alerts") — real data comes later.
 *   - All styling uses CSS custom properties from globals.css (no Tailwind colours).
 */

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Shield,         // App logo icon
  Sun,            // Light-mode icon for theme toggle
  Moon,           // Dark-mode icon for theme toggle
  ChevronDown,    // Dropdown arrow on profile button
  User,           // Guest avatar icon
  FileText,       // "My Reports" menu item
  Bell,           // "Assigned Alerts" menu item
  BookOpen,       // "About" menu item (guest)
  Settings,       // "Settings" menu item
  LogOut,         // "Logout" menu item
  Users,          // "User Management" menu item (admin)
  BarChart2,      // "Dashboard" / "Analytics" menu items (admin)
  Megaphone,      // "System Settings" menu item (admin)
  HelpCircle,     // "Help" menu item (guest)
  LayoutDashboard,// Dashboard icon
} from "lucide-react";

import { useAuth, type AuthUser } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useData } from "../context/DataContext";
import AuthModal from "./AuthModal";
import ReportButton from "./ReportButton";


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single item in the profile dropdown menu. */
interface MenuItem {
  icon: React.ElementType;
  label: string;
  /** When true the item is rendered in the accent (danger) colour. */
  danger?: boolean;
}

// ---------------------------------------------------------------------------
// Role configuration
// ---------------------------------------------------------------------------

/**
 * ROLE_MENUS
 *
 * Maps each role to the list of menu items shown in the profile dropdown.
 * Extend this object when new pages/features are added.
 *
 * Note: "Login" is handled specially in renderDropdown() — it opens the
 * AuthModal instead of navigating.  All other items are plain buttons for now.
 */
const ROLE_MENUS: Record<string, MenuItem[]> = {
  guest: [
    { icon: User, label: "Register" },
    { icon: User, label: "Login" },       // → opens AuthModal
    { icon: BookOpen, label: "About" },
    { icon: HelpCircle, label: "Help" },
  ],
  user: [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: User, label: "Profile" },
    { icon: FileText, label: "My Reports" },
    { icon: Settings, label: "Settings" },
    { icon: LogOut, label: "Logout", danger: true },
  ],
  officer: [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: User, label: "Profile" },
    { icon: Bell, label: "Assigned Alerts" },
    { icon: FileText, label: "Verify Reports" },
    { icon: Settings, label: "Settings" },
    { icon: LogOut, label: "Logout", danger: true },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Users, label: "User Management" },
    { icon: BarChart2, label: "Analytics" },
    { icon: Megaphone, label: "System Settings" },
    { icon: LogOut, label: "Logout", danger: true },
  ],
};

/**
 * ROLE_COLORS
 *
 * Accent colour for each role — used on the avatar circle border and label.
 * Matches the severity palette in the reference design.
 */
const ROLE_COLORS: Record<string, string> = {
  guest:   "#6b7280", // neutral gray
  user:    "#16a34a", // green  (citizen == user in our backend)
  officer: "#ca8a04", // amber
  admin:   "#dc2626", // red
};

/**
 * ROLE_LABELS
 *
 * Human-readable display names shown below the username in the profile button.
 */
const ROLE_LABELS: Record<string, string> = {
  guest:   "Guest",
  user:    "Citizen",
  officer: "Officer",
  admin:   "Admin",
};

// ---------------------------------------------------------------------------
// Helper: derive display values from the auth user
// ---------------------------------------------------------------------------

/**
 * getDisplayRole
 *
 * Returns the string key used to look up menus, colors, and labels.
 * When the user is not logged in, returns "guest".
 *
 * @param user — current AuthUser or null
 */
function getDisplayRole(user: AuthUser | null): string {
  return user?.role ?? "guest";
}

/**
 * getAvatarInitial
 *
 * Returns a single uppercase character for the avatar circle.
 * Falls back to a <User> icon rendered by the caller when the role is guest.
 *
 * @param user — current AuthUser or null
 */
function getAvatarInitial(user: AuthUser | null): string {
  return user?.name?.[0]?.toUpperCase() ?? "";
}

/**
 * getDisplayName
 *
 * Returns the name shown next to the avatar in the profile button.
 *
 * @param user — current AuthUser or null
 */
function getDisplayName(user: AuthUser | null): string {
  // user.name is populated by the profile fetch (optional field).
  // If the user is authenticated but name isn't fetched yet, show the role
  // label (e.g. "Citizen") instead of incorrectly calling them "Guest User".
  if (!user) return "Guest User";
  return user.name ?? ROLE_LABELS[user.role] ?? "User";
}

// Client-side Distance Calculation (Haversine Formula) for localized notifications
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { alerts } = useData();
  const criticalAlertsCount = alerts.filter((a) => a.severity === "critical").length;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  // Resolve user coordinates once after onboarding — GPS preferred, DB fallback
  useEffect(() => {
    console.log("Navbar: user =", user);
    if (!user || !user.isOnboarded) {
      setUserCoords(null);
      return;
    }

    // Only use DB coordinates if they are valid (non-zero)
    const dbCoords = user.location?.coordinates;
    const hasValidDbCoords =
      Array.isArray(dbCoords) &&
      dbCoords.length === 2 &&
      (dbCoords[0] !== 0 || dbCoords[1] !== 0);

    if (user.locationConsent && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("Navbar: Resolved coordinates via GPS =", [pos.coords.latitude, pos.coords.longitude]);
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          console.log("Navbar: GPS failed/denied, falling back to DB coordinates =", dbCoords);
          if (hasValidDbCoords) {
            setUserCoords([dbCoords[1], dbCoords[0]]); // DB is [lng, lat] → convert to [lat, lng]
          } else {
            console.log("Navbar: DB coordinates also invalid [0,0], no vicinity filter applied.");
            setUserCoords(null);
          }
        }
      );
    } else if (hasValidDbCoords) {
      console.log("Navbar: Resolving coordinates via DB coordinates =", dbCoords);
      setUserCoords([dbCoords[1], dbCoords[0]]); // DB is [lng, lat] → convert to [lat, lng]
    } else {
      console.log("Navbar: No valid coordinates available on user profile.");
      setUserCoords(null);
    }
  }, [user]);

  // Filter alerts inside user's local geofence radius (50 km) using resolved coords
  const vicinityAlerts = userCoords
    ? alerts.filter((a) => {
        const dist = getDistance(userCoords[0], userCoords[1], a.lat, a.lng);
        console.log(`Navbar Alert Distance Trace: "${a.title}" is ${dist.toFixed(2)} km away`);
        return dist <= 50;
      })
    : [];

  // Severity color mappings matching app context variables
  const SEVERITY_HEX: Record<string, string> = {
    critical: "#9333ea",
    high: "#dc2626",
    moderate: "#ea580c",
    low: "#ca8a04",
    safe: "#16a34a",
  };

  /** Controls whether the AuthModal (login/register) is open. */
  const [authModalOpen, setAuthModalOpen] = useState(false);

  /**
   * authModalMode — controls which tab the AuthModal opens on.
   * Set to "login" when the user clicks "Login", "register" when they click
   * "Register". Passed down as the `initialMode` prop to AuthModal so the
   * correct tab is pre-selected without the user needing an extra click.
   */
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  /** Ref attached to the dropdown container so clicks outside close it. */
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Close dropdown when user clicks outside ──────────────────────────────

  /**
   * useEffect: outside-click handler
   *
   * Listens for mousedown events on the document. If the click target is
   * outside the dropdown container, the dropdown is closed.
   * Cleaned up on unmount to avoid memory leaks.
   */
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const role       = getDisplayRole(user);
  const roleColor  = ROLE_COLORS[role];
  const roleLabel  = ROLE_LABELS[role];
  const initial    = getAvatarInitial(user);
  const name       = getDisplayName(user);
  const isProfilePage = pathname === "/profile";
  const menuItems  = (ROLE_MENUS[role] ?? ROLE_MENUS.guest).filter(item => {
    if (item.label === "Dashboard") return isProfilePage;
    if (item.label === "Profile") return !isProfilePage;
    return true;
  });

  // ── Action handlers ───────────────────────────────────────────────────────

  /**
   * handleMenuItemClick
   *
   * Dispatches the correct action for each dropdown menu item label.
   * "Login"  → opens AuthModal (does not navigate).
   * "Logout" → calls AuthContext.logout() stub, closes dropdown.
   * Others   → placeholder; will navigate to the relevant page in later phases.
   *
   * @param label — the menu item label string
   */
  async function handleMenuItemClick(label: string) {
    setDropdownOpen(false);

    if (label === "Login") {
      // Open the modal with the Login tab pre-selected.
      setAuthModalMode("login");
      setAuthModalOpen(true);
      return;
    }

    if (label === "Register") {
      // Open the modal with the Register tab pre-selected.
      setAuthModalMode("register");
      setAuthModalOpen(true);
      return;
    }

    if (label === "Logout") {
      await logout();
      router.push("/");
      return;
    }

    if (label === "Profile") {
      router.push("/profile");
      return;
    }

    if (label === "My Reports") {
      router.push("/profile?tab=reports");
      return;
    }

    if (label === "Dashboard") {
      router.push("/");
      return;
    }

    // TODO (routing phase): add navigation for Profile, My Reports, etc.
    console.info(`[Navbar] "${label}" clicked — navigation not yet wired.`);
  }

  /**
   * handleLoginSuccess
   *
   * Called by AuthModal after a successful login or register API response.
   * Stores the returned user in AuthContext and closes the modal.
   *
   * `login` is destructured from useAuth() at the top of the component so
   * it is always the stable, memoised version — safe to call here.
   *
   * TODO (backend phase): the `userData` parameter will be the real user
   * object returned by the backend. For now AuthModal calls onLoginSuccess
   * with whatever the API returns — the shape must match AuthUser.
   *
   * @param userData — user object from the auth API response
   */
  function handleLoginSuccess(userData: AuthUser) {
    // AuthContext.login() stores the user and triggers a Navbar re-render,
    // immediately switching from guest avatar to the logged-in user's profile.
    login(userData);
    setAuthModalOpen(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Header bar ────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between px-4 z-[1001] border-b"
        style={{
          height: "var(--header-h)",
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        {/* ── Left: Logo ─────────────────────────────────────────────── */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all bg-transparent border-0 p-0 outline-none align-middle"
        >
          {/* Shield icon in primary colour */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
          >
            <Shield size={16} strokeWidth={2.5} />
          </div>

          {/* Agency abbreviation — hidden on very small screens */}
          <span
            className="text-xs font-mono uppercase tracking-widest hidden sm:block"
            style={{ color: "var(--fg-muted)" }}
          >
            NDMA
          </span>
        </button>

        {/* ── Centre: App title (absolutely positioned to stay centred) ── */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <div
            className="text-sm font-semibold tracking-tight leading-tight"
            style={{ color: "var(--fg)" }}
          >
            Coastal Hazard Prevention
          </div>
          <div
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: "var(--fg-muted)" }}
          >
            Emergency Response Dashboard
          </div>
        </div>

        {/* ── Right: Controls ────────────────────────────────────────── */}
        <div className="flex items-center gap-2">

          {/* Critical alert badge — static count, wired to real data later */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider anim-float"
            style={{
              background: "#dc262615",
              color: "#dc2626",
              border: "1px solid #dc262630",
            }}
          >
            {/* Blinking dot indicates live/active state */}
            <span
              className="w-1.5 h-1.5 rounded-full anim-blink"
              style={{ background: "#dc2626" }}
            />
            {criticalAlertsCount} Critical Alert{criticalAlertsCount === 1 ? "" : "s"}
          </div>

          {/* ── Notification Bell ────────────────────────────────────── */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 relative cursor-pointer"
                style={{ color: "var(--fg-muted)", background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                title="Local warnings feed"
              >
                <Bell size={15} />
                {vicinityAlerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="anim-pulse-ring absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-xl p-3 shadow-2xl border flex flex-col z-[10000] animate-scale-up"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--fg)" }}>
                    Vicinity Warnings ({vicinityAlerts.length})
                  </div>
                  {vicinityAlerts.length === 0 ? (
                    <div className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>
                      No active threats in your area.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {vicinityAlerts.map((a, idx) => (
                        <div
                          key={a.id || (a as any)._id || idx}
                          className="p-2 rounded-lg border-l-4 flex flex-col gap-0.5"
                          style={{
                            background: "var(--bg-hover)",
                            borderLeftColor: SEVERITY_HEX[a.severity] || "var(--border)",
                          }}
                        >
                          <div className="font-semibold text-xs" style={{ color: "var(--fg)" }}>{a.title}</div>
                          <div className="text-[9px]" style={{ color: "var(--fg-muted)" }}>{a.locationName}</div>
                          <div className="text-[10px] font-medium mt-1" style={{ color: SEVERITY_HEX[a.severity] }}>
                            {a.action}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Theme toggle button ───────────────────────────────────── */}
          {/**
           * Clicking toggles between dark and light by flipping the "dark"
           * class on <html> via ThemeContext.toggleTheme().
           * Sun icon = currently dark (click to switch to light).
           * Moon icon = currently light (click to switch to dark).
           */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
            style={{ color: "var(--fg-muted)", background: "transparent" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle colour theme"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* ── Profile dropdown ─────────────────────────────────────── */}
          <div ref={dropdownRef} className="relative">

            {/**
             * Profile button — shows avatar circle + name + role label.
             * Clicking toggles `dropdownOpen`.
             */}
            <button
              id="profile-menu-btn"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors duration-150"
              style={{
                background: dropdownOpen ? "var(--bg-hover)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!dropdownOpen)
                  e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!dropdownOpen)
                  e.currentTarget.style.background = "transparent";
              }}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              {/* Avatar circle — shows profile image if uploaded, else initial letter or guest icon */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0"
                style={{
                  background: roleColor + "22",
                  color: roleColor,
                  border: `1.5px solid ${roleColor}44`,
                }}
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : role === "guest" ? (
                  <User size={13} />
                ) : (
                  initial
                )}
              </div>

              {/* Name + role badge — hidden on mobile */}
              <div className="hidden sm:flex flex-col items-start">
                <span
                  className="text-xs font-medium leading-none"
                  style={{ color: "var(--fg)" }}
                >
                  {name}
                </span>
                <span
                  className="text-[10px] leading-none mt-0.5"
                  style={{ color: roleColor }}
                >
                  {roleLabel}
                </span>
              </div>

              {/* Chevron rotates when dropdown is open */}
              <ChevronDown
                size={12}
                className="transition-transform duration-200"
                style={{
                  color: "var(--fg-muted)",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {/* ── Dropdown menu ──────────────────────────────────────── */}
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-52 rounded-xl overflow-hidden anim-scale-up z-50"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-lg)",
                }}
                role="menu"
              >
                {/* Dropdown header: shows name + role */}
                <div
                  className="px-3 py-2.5 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="text-[11px] font-medium truncate"
                    style={{ color: "var(--fg)" }}
                  >
                    {name}
                  </div>
                  <div
                    className="text-[10px] font-mono uppercase tracking-wider mt-0.5"
                    style={{ color: roleColor }}
                  >
                    {roleLabel}
                  </div>
                </div>

                {/* Dropdown menu items */}
                <div className="py-1">
                  {menuItems.map(({ icon: Icon, label, danger }) => (
                    <button
                      key={label}
                      role="menuitem"
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-100"
                      style={{
                        color: danger ? "var(--accent)" : "var(--fg)",
                        background: "transparent",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      onClick={() => handleMenuItemClick(label)}
                    >
                      <Icon
                        size={13}
                        strokeWidth={1.8}
                        style={{
                          color: danger ? "var(--accent)" : "var(--fg-muted)",
                        }}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Auth modal (rendered outside header to avoid z-index issues) ── */}
      {/**
       * AuthModal handles login, register, forgot-password, OTP, and reset.
       * It receives onLoginSuccess which will store the user in AuthContext
       * once the backend phase wires the real API response.
       */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authModalMode}
      />
    </>
  );
}
