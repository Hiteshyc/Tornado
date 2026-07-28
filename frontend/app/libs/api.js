async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

/**
 * Refresh the access token.
 * The refreshToken httpOnly cookie is automatically sent by the browser.
 * The API route sets the new access token as an httpOnly cookie on response.
 */
export async function refreshAccessToken() {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

/**
 * Wrapper around fetch for authenticated requests.
 * The httpOnly "token" cookie is automatically sent by the browser
 * on same-origin requests, so no manual Authorization header is needed.
 * If server returns 401 (token expired), it automatically attempts to refresh
 * the token via /api/auth/refresh and retries the request once.
 */
export async function fetchWithAuth(url, options = {}) {
  const headers = { ...options.headers };
  
  // Only set application/json if no Content-Type is provided and we have a body
  // that isn't FormData (FormData needs browser to set boundary automatically)
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && !options._isRetry) {
    try {
      await refreshAccessToken();

      // Retry the request once — the new token cookie is now set
      res = await fetch(url, {
        ...options,
        headers,
        _isRetry: true,
      });
    } catch (err) {
      throw new Error("Session expired. Please log in again.");
    }
  }

  return handleResponse(res);
}

export async function loginUser({ email, password }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function registerUser({ name, email, phone, password }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, password }),
  });
  return handleResponse(res);
}

export async function forgotPassword({ email }) {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function verifyOtp({ email, otp }) {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  return handleResponse(res);
}

export async function resetPassword({
  resetToken,
  newPassword,
  confirmNewPassword,
}) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resetToken, newPassword, confirmNewPassword }),
  });
  return handleResponse(res);
}

export async function getAlerts(severity = "all") {
  const res = await fetch(`/api/alerts?severity=${severity}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}
// =============================================================================
// ── User session & profile ────────────────────────────────────────────────────
// The three functions below are NEW additions for the navbar phase.
// They correspond to the three new backend routes added in the backend phase:
//   POST  /api/auth/logout         → logoutUser()
//   GET   /api/user/me             → getMe()
//   PATCH /api/user/preferences    → updatePreferences()
// =============================================================================

/**
 * logoutUser
 *
 * Asks the server to clear the httpOnly `token` and `refreshToken` cookies,
 * ending the authenticated session on both client and server.
 *
 * Called by AuthContext.logout() before resetting user state.
 *
 * @returns {Promise<void>}
 */
export async function logoutUser() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

export async function getAnnouncements() {
  const res = await fetch("/api/announcements", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}
/**
 * getMe
 *
 * Fetches the currently authenticated user's profile from the server.
 * The httpOnly `token` cookie is sent automatically by the browser on
 * same-origin requests — no manual Authorization header is needed.
 *
 * Returns an object shaped like AuthUser in AuthContext.tsx:
 *   { id, name, email, role, profileImage, preferences: { theme } }
 *
 * Called on app mount inside AuthContext to restore a session after a
 * page refresh (so the user doesn't need to log in again).
 *
 * TODO (backend phase):
 *   - Create GET /api/user/me in userController.js (protected route)
 *   - Add useEffect in AuthContext that calls getMe() on mount:
 *       useEffect(() => { getMe().then(d => login(d.user)).catch(() => {}) }, [])
 */
export async function getMe(userId) {
  return fetchWithAuth(`/api/user/${userId}`);
}

export async function updateUserProfile(userId, data) {
  return fetchWithAuth(`/api/user/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * updatePreferences
 *
 * Persists the user's UI preferences (currently just theme) to their DB record.
 * Keeps the theme consistent when the user logs in from a different device.
 *
 * Called by ThemeContext.toggleTheme() after updating localStorage — only when
 * the user is authenticated (no-op for guests).
 *
 * @param {{ theme: "light"|"dark" }} preferences — preference fields to update
 *
 * TODO (backend phase):
 *   - Create PATCH /api/user/preferences in userController.js (protected route)
 *   - Call this inside ThemeContext.toggleTheme() when user is not null:
 *       if (user) updatePreferences({ theme: nextTheme })
 */
export async function updatePreferences({ theme }) {
  // TODO: uncomment when backend route is ready
  // return fetchWithAuth("/api/user/preferences", {
  //   method: "PATCH",
  //   body: JSON.stringify({ theme }),
  // });
}

/**
 * submitOnboarding
 *
 * Submits the user's phone, address, coordinates, and theme preferences to the
 * Next.js onboarding proxy route, which forwards it to the Express backend.
 *
 * @param {Object} data - onboarding dataset
 * @param {string} data.phone - contact number
 * @param {Object} data.address - street, city, state, zipCode
 * @param {Object} [data.coordinates] - lat, lng (optional if location was denied)
 * @param {Object} [data.preferences] - theme (optional)
 * @returns {Promise<{ message: string, user: AuthUser }>}
 */
export async function submitOnboarding(data) {
  const res = await fetch("/api/user/onboarding", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

/**
 * getNationalAlerts
 *
 * Fetches all active alerts across India from the Next.js API proxy route.
 *
 * @returns {Promise<{ success: boolean, alerts: Alert[] }>}
 */
export async function getNationalAlerts() {
  const res = await fetch("/api/alerts", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

/**
 * getNearbyAlerts
 *
 * Fetches active alerts within a specific radius of coordinates.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in kilometers
 * @returns {Promise<{ success: boolean, alerts: Alert[] }>}
 */
export async function getNearbyAlerts(lat, lng, radius) {
  const res = await fetch(`/api/alerts/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}


export async function getSafetyGuides() {
  const res = await fetch("/api/safety-guides", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

export async function getUserReports(userId) {
  return fetchWithAuth(`/api/user/${userId}/reports`, {
    method: "GET",
  });
}

export async function uploadProfileImage(userId, formData) {
  // We don't set Content-Type header here because fetch will automatically
  // set it to multipart/form-data with the correct boundary when body is FormData.
  return fetchWithAuth(`/api/user/${userId}/profile-image`, {
    method: "PATCH",
    body: formData,
  });
}
