"use client";

import { useState, useEffect } from "react";
import ReportModal from "./ReportModal";
import AuthModal from "./AuthModal";

const STORAGE_KEY = "ws_user"; // same key used by AuthButton

export default function ReportButton() {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // ── Read user from localStorage on mount (same source as AuthButton) ──────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}
  }, []);

  // ── Listen for login/logout changes from AuthButton on other pages ─────────
  useEffect(() => {
    function onStorageChange(e) {
      if (e.key === STORAGE_KEY) {
        try {
          setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setCurrentUser(null);
        }
      }
    }
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  // Called from gate screen "Log In to Continue"
  function handleLoginRequired() {
    setIsReportOpen(false);
    setIsAuthOpen(true);
  }

  // Called by embedded AuthModal on successful login
  function handleLoginSuccess(user) {
    setCurrentUser(user);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
    setIsAuthOpen(false);
    setIsReportOpen(true); // reopen — gate is now skipped
  }

  return (
    <>
      <button
        id="report-button"
        onClick={() => setIsReportOpen(true)}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
      >
        Report
      </button>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        currentUser={currentUser}
        onLoginRequired={handleLoginRequired}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
