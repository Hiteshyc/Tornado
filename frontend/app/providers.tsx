"use client";

/**
 * providers.tsx
 *
 * Single entry-point that composes all application-level context providers.
 *
 * Why a dedicated file?
 *   Next.js App Router layouts are Server Components by default.
 *   Context providers require the React client runtime ("use client"), so they
 *   cannot be declared directly inside layout.tsx without turning the entire
 *   layout into a Client Component (which would break RSC streaming).
 *   This wrapper is the conventional Next.js pattern for keeping layout.tsx
 *   as a Server Component while still providing client-side context.
 *
 * Provider nesting order matters (AuthProvider outermost):
 *   AuthProvider is outermost so ThemeProvider (inside it) can call
 *   useAuth() to read user.preferences.theme and sync the theme when
 *   the user logs in. ThemeProvider defaults to "light" (SSR-safe) and
 *   updates to the user's saved preference after login.
 */

import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, type AuthUser, useAuth } from "./contexts/AuthContext";
import { DataProvider } from "./context/DataContext";
import OnboardingModal from "./components/OnboardingModal";
import type { ReactNode } from "react";

interface ProvidersProps {
  /** The Next.js page or layout children to render inside the provider tree. */
  children: ReactNode;
  /**
   * Pre-decoded JWT session data from layout.tsx (Server Component).
   * Contains only { id, role } — extracted from the httpOnly cookie before
   * the first byte of HTML is sent to the browser.
   * Passed straight through to AuthProvider so user state is populated
   * on the very first client render with no async fetch required.
   */
  initialUser?: Pick<AuthUser, "id" | "role"> | null;
}

/**
 * OnboardingWrapper
 *
 * Client-side gatekeeper component. If a user session is active (user is logged in)
 * but the user has not completed onboarding (isOnboarded is false), this wrapper
 * forces the non-dismissible OnboardingModal to mount, blocking dashboard access.
 */
function OnboardingWrapper({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <>
      {children}
      {user && !user.isOnboarded && <OnboardingModal isOpen={true} />}
    </>
  );
}

/**
 * Providers
 *
 * Renders the full provider tree wrapping the given children.
 * Import and use this in app/layout.tsx:
 *
 *   <Providers>{children}</Providers>
 */
export default function Providers({ children, initialUser }: ProvidersProps) {
  return (
    /*
     * AuthProvider is now outermost (order changed from the original).
     * ThemeProvider needs to call useAuth() to read user.preferences.theme
     * and sync the theme when the user logs in — this only works if
     * ThemeProvider is a descendant of AuthProvider.
     */
    <AuthProvider initialUser={initialUser}>
      {/*
       * ThemeProvider sits inside AuthProvider and can safely call useAuth().
       * It defaults to "light" (SSR-safe) and updates to the user's saved
       * theme preference once user.preferences.theme is populated after login.
       */}
      <ThemeProvider>
        <DataProvider>
          <OnboardingWrapper>{children}</OnboardingWrapper>
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

