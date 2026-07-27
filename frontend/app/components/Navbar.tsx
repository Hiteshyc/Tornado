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
import {
  Shield,       // App logo icon
  Sun,          // Light-mode icon for theme toggle
  Moon,         // Dark-mode icon for theme toggle
  ChevronDown,  // Dropdown arrow on profile button
  User,         // Guest avatar icon
  FileText,     // "My Reports" menu item
  Bell,         // "Assigned Alerts" menu item
  BookOpen,     // "About" menu item (guest)
  Settings,     // "Settings" menu item
  LogOut,       // "Logout" menu item
  Users,        // "User Management" menu item (admin)
  BarChart2,    // "Dashboard" / "Analytics" menu items (admin)
  Megaphone,    // "System Settings" menu item (admin)
  HelpCircle,   // "Help" menu item (guest)
} from "lucide-react";

import { useAuth, type AuthUser } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
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
    { icon: User, label: "Profile" },
    { icon: FileText, label: "My Reports" },
    { icon: Settings, label: "Settings" },
    { icon: LogOut, label: "Logout", danger: true },
  ],
  officer: [
    { icon: User, label: "Profile" },
    { icon: Bell, label: "Assigned Alerts" },
    { icon: FileText, label: "Verify Reports" },
    { icon: Settings, label: "Settings" },
    { icon: LogOut, label: "Logout", danger: true },
  ],
  admin: [
    { icon: BarChart2, label: "Dashboard" },
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  /** Controls whether the profile dropdown is visible. */
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
  const menuItems  = ROLE_MENUS[role] ?? ROLE_MENUS.guest;

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
  function handleMenuItemClick(label: string) {
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
      logout(); // clears user from AuthContext (stub — no cookie clearing yet)
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
        className="shrink-0 flex items-center justify-between px-4 z-40 border-b"
        style={{
          height: "var(--header-h)",
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        {/* ── Left: Logo ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5">
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
        </div>

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
            2 Critical Alerts
          </div>

          {/* Report button — opens ReportModal; auth-gated inside the component */}
          <ReportButton />

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
              {/* Avatar circle — shows initial letter or guest icon */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  background: roleColor + "22",
                  color: roleColor,
                  border: `1.5px solid ${roleColor}44`,
                }}
              >
                {role === "guest" ? (
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
