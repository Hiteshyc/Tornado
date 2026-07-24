"use client";

/**
 * ThemeContext.tsx
 *
 * Manages the application colour theme ("light" | "dark") and exposes a
 * toggle function to any consumer via the `useTheme()` hook.
 *
 * Theme priority (highest → lowest):
 *   1. User DB preference (user.preferences.theme) — applied after login via
 *      a useEffect that watches the AuthContext user state.
 *   2. In-session toggle — in-memory only, not persisted for guests.
 *      Logged-in toggle will be persisted to DB in the backend phase via
 *      PATCH /api/user/preferences.
 *   3. Default: always "light" — SSR-safe, no localStorage read on init.
 *
 * Why "light" as the hardcoded default (Option B):
 *   Reading localStorage inside useState() runs on both server (returns
 *   undefined) and client (returns stored value), causing a hydration
 *   mismatch. Fixing this: server and client both start with "light" —
 *   no conditional, no branch, no mismatch.
 *   Guests who toggle get the changed theme for the current session only;
 *   it resets on refresh. Logged-in users have their preference stored in
 *   the DB and restored via user.preferences.theme immediately after login.
 *
 * Applying the theme:
 *   Adding/removing the "dark" class on <html> is the sole mechanism.
 *   All CSS custom properties in globals.css are scoped to `:root` (light)
 *   and `.dark` (dark), so toggling the class is enough to repaint the
 *   entire UI without any inline styles.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Theme = "light" | "dark";

interface ThemeContextType {
  /** Current active theme. */
  theme: Theme;
  /**
   * Flips the theme between light and dark, persists the choice to
   * localStorage, and updates the <html> class.
   *
   * TODO (backend phase): also call PATCH /api/user/preferences when the
   * user is logged in so the preference is saved to their DB record.
   */
  toggleTheme: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * applyTheme
 *
 * Synchronises the <html> element's class list with the current theme value.
 * Must only be called client-side (inside a useEffect) — document is not
 * available during SSR.
 *
 * localStorage is intentionally absent (Option B): guests get no persistence
 * across page refreshes. Logged-in users have their preference stored in the
 * DB and restored via user.preferences.theme on every login.
 *
 * @param theme — the theme to apply
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<ThemeContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * ThemeProvider
 *
 * Place this above any component that uses `useTheme()`.
 * In practice it wraps the entire app inside providers.tsx.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  /**
   * "light" is the SSR-safe hardcoded default (Option B).
   * Both the Next.js server and the browser start with "light", so React
   * hydration always sees matching HTML — no mismatch, no console error.
   */
  const [theme, setTheme] = useState<Theme>("light");

  /**
   * user — consumed from AuthContext.
   * ThemeProvider is nested inside AuthProvider (providers.tsx) so useAuth()
   * is safe to call here. `user` is null for guests and populated (with
   * optional preferences.theme) after a successful login + profile fetch.
   */
  const { user } = useAuth();

  /**
   * DOM sync: whenever `theme` state changes, update the <html> class.
   * Runs client-side only (inside useEffect) — safe from SSR.
   */
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /**
   * User preference sync.
   *
   * Fires whenever the `user` object changes — on login, logout, or
   * after the profile API response populates preferences.
   *
   * On login / profile fetch: applies user.preferences.theme, overriding
   *   the default "light" so the user sees their saved choice immediately.
   * On logout: resets to "light" (the Option B default for guests).
   * If preferences are not yet fetched: no-op (keeps current theme).
   */
  useEffect(() => {
    if (user?.preferences?.theme) {
      setTheme(user.preferences.theme);
    } else if (!user) {
      // User logged out — revert to the guest default.
      setTheme("light");
    }
  }, [user]);

  /**
   * toggleTheme
   *
   * Flips between "light" and "dark" in-memory.
   *
   * Guests: applies for the session only; resets on page refresh.
   * Logged-in users:
   *   TODO (backend phase): call PATCH /api/user/preferences { theme: next }
   *   after setTheme() so the new preference is persisted to the DB and
   *   automatically restored on the next login via user.preferences.theme.
   */
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

/**
 * useTheme
 *
 * Returns the current theme and the toggle function.
 *
 * @example
 *   const { theme, toggleTheme } = useTheme();
 *
 * @throws if used outside of <ThemeProvider>
 */
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme() must be used inside <ThemeProvider>");
  }
  return ctx;
}
