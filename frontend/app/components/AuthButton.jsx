"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";

const STORAGE_KEY = "ws_user"; // localStorage key for persisted user

export default function AuthButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // ── Restore user from localStorage on mount ──────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLoginSuccess(userData) {
    setIsModalOpen(false);
    setUser(userData);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)); } catch {}
    router.push("/dashboard");
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setUser(null);
    setDropdownOpen(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    router.push("/");
  }

  // ── Not logged in → Login button ─────────────────────────────────────────
  if (!user) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-black px-4 py-2 text-sm text-white"
        >
          Log in
        </button>

        <AuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  // ── Logged in → Profile button + dropdown ────────────────────────────────
  const initials = user.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile button */}
      <button
        onClick={() => setDropdownOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm hover:shadow-md transition"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
          {initials}
        </span>
        <span className="max-w-[120px] truncate">{user.name}</span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-xl z-50">
          {/* Avatar + name/email */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* Details */}
          <div className="mt-3 space-y-2.5 text-xs">
            {user.userCode && (
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-gray-400 font-medium mb-0.5">User ID</p>
                <p className="font-mono font-bold text-gray-900 tracking-widest">{user.userCode}</p>
              </div>
            )}
            {user.phone && (
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-gray-400 font-medium mb-0.5">Phone</p>
                <p className="font-semibold text-gray-900">{user.phone}</p>
              </div>
            )}
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-gray-400 font-medium mb-0.5">Role</p>
              <p className="font-semibold text-gray-900 capitalize">{user.role}</p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
