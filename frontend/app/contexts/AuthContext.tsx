"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { logoutUser } from "../libs/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of the authenticated user stored in context.
 *
 * Only `id` and `role` are required — these come directly from the JWT payload
 * decoded in layout.tsx and are always available after login.
 *
 * All other fields are optional because they require a separate profile API
 * call (GET /api/user/[userId]) that will be wired in the backend phase.
 * Components should use optional chaining (user.name ?? "User") for safety.
 */
export interface AuthUser {
  /** MongoDB _id of the user — used to build /api/user/[userId] URLs. */
  id: string;
  /** Determines which Navbar menu items and role badge colour are shown. */
  role: "user" | "officer" | "admin";
  /** Display name — populated from profile fetch; undefined until then. */
  name?: string;
  /** Email address — populated from profile fetch. */
  email?: string;
  /** URL to the user's avatar image, or null if none uploaded. */
  profileImage?: string | null;
  /** Persisted UI preferences — populated from profile fetch. */
  preferences?: {
    theme: "light" | "dark";
  };
}

/** Everything consumers of this context can read or call. */
interface AuthContextType {
  /** `null` means the visitor is a guest (not logged in). */
  user: AuthUser | null;
  /** True while the initial session-restore fetch is in flight. */
  isLoading: boolean;
  /**
   * Called after a successful login or register response.
   * Stores the returned user object into context state.
   * @param user — the user object from the API response
   */
  login: (user: AuthUser) => void;
  /**
   * Clears the user from context state.
   * Also calls POST /api/auth/logout to clear cookies.
   */
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Context creation
// ---------------------------------------------------------------------------

/** The context object — consumers import `useAuth()` instead of this directly. */
const AuthContext = createContext<AuthContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/** Props accepted by AuthProvider. */
interface AuthProviderProps {
  children: ReactNode;
  /**
   * Pre-decoded session data passed down from layout.tsx (Server Component).
   * Contains only the fields extracted from the JWT — id and role.
   * When present, the user state is initialised immediately on first render
   * so the Navbar shows the correct role without any client-side fetch.
   * When null/undefined, the visitor is treated as a guest.
   */
  initialUser?: Pick<AuthUser, "id" | "role"> | null;
}

/**
 * AuthProvider
 *
 * Wraps the application so any descendant can call `useAuth()` to read or
 * update authentication state.
 *
 * Receives `initialUser` from layout.tsx which decoded the JWT server-side.
 * This means `user` is never null on first render for authenticated visitors.
 */
export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  /**
   * user — the authenticated user, or null for guests.
   *
   * Initialised with `initialUser` so the value is correct from the very
   * first render. For a fresh login the value starts as null and is set
   * by `login()` after the auth API responds.
   *
   * Note: initialUser only has { id, role }. Full profile fields (name,
   * email, etc.) are undefined until a profile fetch is completed.
   */
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  /**
   * isLoading — false because session state is resolved synchronously via
   * the `initialUser` prop (decoded server-side in layout.tsx).
   * No async fetch is needed to know who is logged in.
   */
  const [isLoading] = useState(false);

  /**
   * login — stores the user returned from the auth API into local state.
   * Navbar reads this to switch from guest avatar to the user's profile.
   */
  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
  }, []);

  /**
   * logout — clears the user from client state, reverting the Navbar to guest
   * mode. Calls POST /api/auth/logout to clear browser cookies and backend token.
   */
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn("[AuthContext] Logout warning: failed to clear cookies on server:", err);
    } finally {
      setUser(null);
    }
  }, []);


  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

/**
 * useAuth
 *
 * Convenience hook — call inside any client component to access auth state.
 *
 * @example
 *   const { user, login, logout } = useAuth();
 *
 * @throws if used outside of <AuthProvider>
 */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside <AuthProvider>");
  }
  return ctx;
}
