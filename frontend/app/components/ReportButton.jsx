"use client";

import { useState } from "react";
import ReportModal from "./ReportModal";
import AuthModal from "./AuthModal";

/**
 * ReportButton
 *
 * Self-contained Report button.  Manages its own auth state so it works
 * correctly regardless of whether the parent passes a currentUser or not.
 *
 * Flow:
 *  - Not logged in  → gate screen → "Log In to Continue" opens AuthModal
 *                                    after login: reopens ReportModal at form
 *  - Logged in      → ReportModal opens directly at form (gate skipped)
 *
 * Props:
 *   currentUser – object | null  (optional, pass if parent already knows the user)
 *                 Shape: { _id, name, phone?, email? }
 */
export default function ReportButton({ currentUser: initialUser = null }) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  // Internal user state — starts from whatever parent passes in
  const [currentUser, setCurrentUser] = useState(initialUser);

  // Called from the gate screen "Log In to Continue" button
  function handleLoginRequired() {
    setIsReportOpen(false); // close report modal first
    setIsAuthOpen(true);    // open the existing AuthModal
  }

  // Called by AuthModal on successful login
  function handleLoginSuccess(user) {
    setCurrentUser(user);   // store the logged-in user
    setIsAuthOpen(false);   // close auth modal
    setIsReportOpen(true);  // reopen report modal — gate is now skipped
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

      {/* Report modal — passes onLoginRequired so gate button works */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        currentUser={currentUser}
        onLoginRequired={handleLoginRequired}
      />

      {/* Auth modal — embedded here, opened only from the gate screen */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
