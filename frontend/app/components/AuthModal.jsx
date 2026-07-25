"use client";

import { useState, useEffect, useRef } from "react";
import {
  loginUser,
  registerUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../libs/api";

// modes: "login" | "register" | "forgot-otp" | "forgot-reset"
//
// initialMode — optional prop that sets which tab is active when the modal
// first opens. Navbar passes "login" or "register" depending on which item
// the user clicked. Defaults to "login" if not provided.
export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [resetToken, setResetToken] = useState(null);

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ---- OTP timer state (do not store OTP, just a 30s cooldown) ----
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  // ---- Sync mode to initialMode each time the modal opens ----
  // When the modal is closed and reopened via a different entry point
  // (e.g. user clicks "Register" after previously closing from "Login"),
  // this resets mode to whichever tab the caller requested.
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError("");
      setInfoMessage("");
    }
  }, [isOpen, initialMode]);

  // ---- Countdown effect when entering "forgot-otp" mode ----
  useEffect(() => {
    if (mode === "forgot-otp") {
      setTimer(30);
      setCanResend(false);
      setOtp(""); // clear any previously entered OTP

      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode]);

  if (!isOpen) return null;

  function resetLocalState() {
    setForm({ name: "", email: "", password: "" });
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetToken(null);
    setError("");
    setInfoMessage("");
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError("");
    setInfoMessage("");
  }

  async function handleForgotPasswordClick() {
    const emailValue = form.email.trim();
    if (!emailValue) {
      setError("Email is required");
      return;
    }

    setForm((prev) => ({ ...prev, email: emailValue }));
    setError("");
    setLoading(true);

    try {
      await forgotPassword({ email: emailValue });
      setInfoMessage(`A code has been sent to ${emailValue}.`);
      switchMode("forgot-otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ---- Login / Register ----
  async function handleAuthSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data =
        mode === "login" ? await loginUser(form) : await registerUser(form);

      onLoginSuccess(data.user);
      resetLocalState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---- Step 1: verify OTP ----
  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await verifyOtp({ email: form.email, otp });
      setResetToken(data.resetToken);
      setInfoMessage("");
      switchMode("forgot-reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setLoading(true);
    try {
      await forgotPassword({ email: form.email });
      setOtp(""); // clear OTP — don't store it
      setTimer(30);
      setCanResend(false);
      setInfoMessage("A new code has been sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---- Step 3: set new password ----
  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword({
        resetToken,
        newPassword,
        confirmNewPassword,
      });

      // Password updated successfully — log the user in directly
      onLoginSuccess(data.user);
      resetLocalState();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    resetLocalState();
    setMode("login");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher — only shown for login/register, not mid-reset-flow */}
        {(mode === "login" || mode === "register") && (
          <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "register"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* ---- LOGIN / REGISTER ---- */}
        {(mode === "login" || mode === "register") && (
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {mode === "register" && (
              <input
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            )}
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-xs text-gray-500 underline hover:text-gray-800"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-black py-2 text-sm text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
          </form>
        )}

        {/* ---- FORGOT PASSWORD: STEP 1 — enter OTP ---- */}
        {mode === "forgot-otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-3">
            <h2 className="text-lg font-semibold">Enter the code</h2>
            <p className="text-sm text-gray-500">{infoMessage}</p>

            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              maxLength={6}
              className="w-full rounded-md border px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-black"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-md bg-black py-2 text-sm text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify code"}
            </button>

            <div className="flex items-center justify-between text-xs">
              {!canResend ? (
                <span className="text-gray-400">Resend code in {timer}s</span>
              ) : (
                <span className="text-gray-500">
                  Code expired? Resend below
                </span>
              )}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || !canResend}
                className={`underline transition disabled:opacity-50 ${
                  canResend
                    ? "text-gray-700 hover:text-gray-900"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? "Resending..." : "Resend code"}
              </button>
            </div>
          </form>
        )}

        {/* ---- FORGOT PASSWORD: STEP 3 — new password ---- */}
        {mode === "forgot-reset" && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
            <h2 className="text-lg font-semibold">Set a new password</h2>

            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-black py-2 text-sm text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Updating password..." : "Update password & log in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
