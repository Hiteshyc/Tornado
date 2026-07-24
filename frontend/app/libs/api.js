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
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

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
