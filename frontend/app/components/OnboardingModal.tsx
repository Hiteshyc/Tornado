"use client";

import React, { useState, useEffect } from "react";
import { Phone, MapPin, CheckCircle, Smartphone, Compass, ArrowRight, Loader } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { submitOnboarding } from "../libs/api";

interface OnboardingModalProps {
  isOpen: boolean;
}

type OnboardingStep = "welcome" | "location_query" | "address_form" | "submitting";

export default function OnboardingModal({ isOpen }: OnboardingModalProps) {
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [phone, setPhone] = useState("");
  
  // Address form fields
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Geolocation state
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Prevent closing when Escape is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen || !user) return null;

  // Handles moving to Step 2 (Location Permission Query)
  const handleWelcomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setFormError("Please enter a valid phone number.");
      return;
    }
    setFormError("");
    setStep("location_query");
  };

  // Handles requesting browser geolocation permission
  const handleAllowLocation = () => {
    setGeoLoading(true);
    setGeoError("");

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      setGeoLoading(false);
      setStep("address_form");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });

        // Query OpenStreetMap Nominatim reverse geocoding API to pre-fill address fields
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: { "User-Agent": "Coastal-Hazard-Prevention-System" },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            setAddress({
              street: addr.road || addr.suburb || addr.neighbourhood || "",
              city: addr.city || addr.town || addr.village || "",
              state: addr.state || "",
              zipCode: addr.postcode || "",
            });
          }
        } catch (err) {
          console.warn("Reverse geocoding failed, fields will remain empty for manual typing: ", err);
        } finally {
          setGeoLoading(false);
          setStep("address_form");
        }
      },
      (error) => {
        console.warn("Geolocation permission denied: ", error.message);
        setGeoError("Location permission denied. Please fill in your address manually.");
        setGeoLoading(false);
        setStep("address_form");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Skip geolocation and go directly to manual address entry
  const handleDenyLocation = () => {
    setStep("address_form");
  };

  // Final submit handler to save onboarding details to database
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.street || !address.city || !address.state || !address.zipCode) {
      setFormError("All address fields are required.");
      return;
    }

    setFormError("");
    setSubmitLoading(true);
    setStep("submitting");

    try {
      const payload = {
        phone,
        address,
        preferences: { theme },
        locationConsent: !!coords, // true if coordinates were resolved, false if entered manually
        ...(coords ? { coordinates: coords } : {}),
      };

      const response = await submitOnboarding(payload);

      if (response && response.user) {
        // Update local auth context state with the fully onboarded user details
        login(response.user);
      }
    } catch (err: any) {
      setFormError(err.message || "Something went wrong. Please check your inputs and try again.");
      setStep("address_form");
      setSubmitLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Glassmorphic Modal Box Container */}
      <div 
        className="w-full max-w-md rounded-2xl border p-8 shadow-2xl transition-all duration-300"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        {/* Step Indicator Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono tracking-wider uppercase opacity-65">
              Secure Onboarding
            </span>
          </div>
          <div className="flex gap-1.5">
            <span className={`h-1 w-6 rounded-full transition-colors ${step === "welcome" ? "bg-blue-500" : "bg-gray-700"}`} />
            <span className={`h-1 w-6 rounded-full transition-colors ${step === "location_query" ? "bg-blue-500" : "bg-gray-700"}`} />
            <span className={`h-1 w-6 rounded-full transition-colors ${step === "address_form" ? "bg-blue-500" : "bg-gray-700"}`} />
          </div>
        </div>

        {/* STEP 1: WELCOME & PHONE NUMBER */}
        {step === "welcome" && (
          <form onSubmit={handleWelcomeSubmit} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Complete your profile</h2>
              <p className="text-sm opacity-70">
                Hi <span className="font-semibold text-blue-500">{user.name || "User"}</span>, we need a few more details to set up your account.
              </p>
            </div>

            {/* Theme Preference Option */}
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Select Interface Color Theme</h4>
                  <p className="text-xs opacity-60">You can toggle this from the navbar anytime.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase hover:bg-gray-500/10"
                  style={{ borderColor: "var(--border)" }}
                >
                  {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
                </button>
              </div>
            </div>

            {/* Phone input */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                <Smartphone size={16} className="text-blue-500" />
                Contact Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                style={{ borderColor: "var(--border)" }}
              />
            </div>

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors duration-200"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: GEOLOCATION PERMISSION QUERY */}
        {step === "location_query" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
              <Compass size={28} className="text-blue-500 animate-spin" style={{ animationDuration: "12s" }} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Enable Location Services?</h2>
              <p className="text-sm opacity-70 px-2">
                Allowing location permissions lets us auto-fill your home address fields and maps coastal hazard regions near you.
              </p>
            </div>

            {geoLoading ? (
              <div className="py-4 flex flex-col items-center justify-center gap-3">
                <Loader className="animate-spin text-blue-500" size={24} />
                <span className="text-xs opacity-60">Detecting location coordinates...</span>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleAllowLocation}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white transition-colors"
                >
                  Yes, Detect My Location
                </button>
                <button
                  type="button"
                  onClick={handleDenyLocation}
                  className="w-full rounded-lg border py-3 text-sm font-semibold hover:bg-gray-500/10 transition-colors"
                  style={{ borderColor: "var(--border)" }}
                >
                  No, Type Address Manually
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: ADDRESS FORM */}
        {step === "address_form" && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <MapPin size={20} className="text-blue-500" />
                Home Address
              </h2>
              <p className="text-xs opacity-60">
                Confirm your details below. You can edit any fields if needed.
              </p>
            </div>

            {coords && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs text-emerald-500 flex items-center gap-2">
                <CheckCircle size={14} />
                Location coordinates successfully resolved!
              </div>
            )}

            <div className="space-y-3">
              {/* Street */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">Street / Road Address</label>
                <input
                  type="text"
                  placeholder="e.g. 123 Beach Rd, Colony"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Panaji"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    required
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Goa"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    required
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
              </div>

              {/* Zip Code */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">Zip / Postal Code</label>
                <input
                  type="text"
                  placeholder="e.g. 403001"
                  value={address.zipCode}
                  onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            </div>

            {geoError && <p className="text-xs text-amber-500 font-medium">{geoError}</p>}
            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white transition-colors mt-2"
            >
              Complete Onboarding
            </button>
          </form>
        )}

        {/* STEP 4: SUBMITTING / LOADER */}
        {step === "submitting" && (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
            <Loader className="animate-spin text-blue-500" size={32} />
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Saving profile details...</h3>
              <p className="text-xs opacity-60">Updating emergency configuration & geographic coordinates.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
