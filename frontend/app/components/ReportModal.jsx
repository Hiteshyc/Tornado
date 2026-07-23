"use client";

import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DISASTER_TYPES = [
  "Flood",
  "Cyclone",
  "Tsunami",
  "Landslide",
  "Coastal Erosion",
  "Storm Surge",
  "Heavy Rainfall",
  "Fire",
  "Earthquake",
  "Building Collapse",
  "Chemical Leak",
  "Oil Spill",
  "Other",
];

const SEVERITY_LABELS = {
  1: "Very Low",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Critical",
};

const SEVERITY_COLORS = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#f59e0b",
  4: "#f97316",
  5: "#ef4444",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getLocationString(coords) {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

// ---------------------------------------------------------------------------
// ReportModal
// Props:
//   isOpen        – boolean
//   onClose       – () => void
//   currentUser   – object | null  (pass the authenticated user if available)
//                   Expected shape: { name, phone, email, _id }
// ---------------------------------------------------------------------------
export default function ReportModal({ isOpen, onClose, currentUser, onLoginRequired }) {
  // ── Guest gate ────────────────────────────────────────────────────────────
  // "gate" | "form"
  const [step, setStep] = useState("gate");

  // ── Form state ────────────────────────────────────────────────────────────
  const isLoggedIn = Boolean(currentUser);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  // Location
  const [location, setLocation] = useState("");           // human-readable address
  const [locationCoords, setLocationCoords] = useState(null); // { lat, lng } raw coords
  const [locationAccuracy, setLocationAccuracy] = useState(null); // accuracy in metres
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  // Landmark
  const [landmark, setLandmark] = useState("");

  // Disaster type
  const [disasterType, setDisasterType] = useState("");
  const [disasterSearch, setDisasterSearch] = useState("");
  const [showDisasterDropdown, setShowDisasterDropdown] = useState(false);
  const [customDisaster, setCustomDisaster] = useState("");

  // Severity
  const [severity, setSeverity] = useState(null);

  // Description
  const [description, setDescription] = useState("");

  // Rescue
  const [rescueRequired, setRescueRequired] = useState(false);
  const [rescueDetails, setRescueDetails] = useState("");

  // Media
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  // Disclaimer
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Disaster dropdown filtered list
  const filteredDisasters = DISASTER_TYPES.filter((d) =>
    d.toLowerCase().includes(disasterSearch.toLowerCase()),
  );

  // ── Effects ───────────────────────────────────────────────────────────────

  // Pre-fill from logged-in user
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setName(currentUser.name || "");
      setContact(currentUser.phone || currentUser.email || "");
    }
  }, [isLoggedIn, currentUser]);

  // Auto-skip gate if user is logged in
  useEffect(() => {
    if (isOpen) {
      setStep(isLoggedIn ? "form" : "gate");
    }
  }, [isOpen, isLoggedIn]);

  // Request geolocation when form step mounts
  useEffect(() => {
    if (step === "form" && !locationGranted && !location) {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Build media previews whenever files change
  useEffect(() => {
    const previews = mediaFiles.map((file) => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
    setMediaPreviews(previews);

    // Cleanup object URLs on unmount / file change
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [mediaFiles]);

  // ── Geolocation ───────────────────────────────────────────────────────────
  async function requestLocation() {
    if (!navigator.geolocation) {
      return; // browser doesn't support it — user will type manually
    }
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Store raw coords and accuracy for database
        setLocationCoords({ lat: latitude, lng: longitude });
        setLocationAccuracy(Math.round(accuracy));

        // Reverse geocode to get human-readable address via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          // Use the full display name if available, else fall back to coords
          setLocation(data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } catch {
          // Network error — fall back to raw coordinates
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }

        setLocationGranted(true);
        setLocationLoading(false);
      },
      () => {
        // Permission denied or error — allow manual entry
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // ── Media handling ────────────────────────────────────────────────────────
  function handleFileSelect(e) {
    addFiles(Array.from(e.target.files));
  }

  function addFiles(incoming) {
    const allowed = incoming.filter((f) =>
      /image\/(jpeg|jpg|png|webp)|video\/(mp4|quicktime|webm)/.test(f.type),
    );
    setMediaFiles((prev) => [...prev, ...allowed]);
  }

  function removeFile(index) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Drag-and-drop handlers
  function handleDragOver(e) {
    e.preventDefault();
    dropRef.current?.classList.add("drag-over");
  }

  function handleDragLeave() {
    dropRef.current?.classList.remove("drag-over");
  }

  function handleDrop(e) {
    e.preventDefault();
    dropRef.current?.classList.remove("drag-over");
    addFiles(Array.from(e.dataTransfer.files));
  }

  // ── Reset & Close ─────────────────────────────────────────────────────────
  function resetAll() {
    setStep("gate");
    setName(isLoggedIn ? currentUser?.name || "" : "");
    setContact(
      isLoggedIn ? currentUser?.phone || currentUser?.email || "" : "",
    );
    setLocation("");
    setLocationGranted(false);
    setLandmark("");
    setDisasterType("");
    setDisasterSearch("");
    setShowDisasterDropdown(false);
    setCustomDisaster("");
    setSeverity(null);
    setDescription("");
    setRescueRequired(false);
    setRescueDetails("");
    setMediaFiles([]);
    setMediaPreviews([]);
    setDisclaimerAcknowledged(false);
    setSubmitError("");
    setSubmitSuccess(false);
    setSubmitting(false);
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  // ── Validation & Submit ───────────────────────────────────────────────────
  function validate() {
    if (!disclaimerAcknowledged) return "Please acknowledge the disclaimer.";
    if (!name.trim()) return "Name is required.";
    if (!contact.trim()) return "Contact information is required.";
    if (!location.trim()) return "Location is required.";
    if (!disasterType) return "Disaster type is required.";
    if (disasterType === "Other" && !customDisaster.trim())
      return "Please specify the disaster type.";
    if (!severity) return "Severity rating is required.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    const err = validate();
    if (err) {
      setSubmitError(err);
      return;
    }

    setSubmitting(true);

    // Build payload — backend auto-captures submittedAt
    const payload = {
      guestName: isLoggedIn ? null : name,
      guestContact: isLoggedIn ? null : contact,
      location,
      locationCoords: locationCoords || null,
      locationAccuracy: locationAccuracy || null,
      landmark: landmark || null,
      disasterType: disasterType === "Other" ? customDisaster : disasterType,
      severity,
      description: description || null,
      rescueRequired,
      rescueDetails: rescueRequired ? rescueDetails || null : null,
    };

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include", // sends httpOnly token cookie for logged-in users
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data.message || "Failed to submit report. Please try again.");
        return;
      }

      setSubmitSuccess(true);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render guard ──────────────────────────────────────────────────────────
  if (!isOpen) return null;

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={handleClose}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 text-5xl">✅</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Report Submitted
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Thank you for reporting. Authorities have been notified and will
            respond as soon as possible.
          </p>
          <button
            onClick={handleClose}
            className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ── Gate screen (not logged in) ───────────────────────────────────────────
  if (!isLoggedIn && step === "gate") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={handleClose}
      >
        <div
          className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Submit a Report
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                You&apos;re not logged in. How would you like to continue?
              </p>
            </div>
            <button
              onClick={handleClose}
              className="ml-2 text-gray-400 hover:text-gray-700 text-xl leading-none"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Log In option — opens the AuthModal via the parent ReportButton */}
            <button
              onClick={() => {
                if (typeof onLoginRequired === "function") {
                  onLoginRequired();
                } else {
                  handleClose();
                }
              }}
              className="w-full rounded-xl border-2 border-black bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800 transition"
            >
              Log In to Continue
            </button>

            <button
              onClick={() => setStep("form")}
              className="w-full rounded-xl border-2 border-gray-300 py-3 text-sm font-medium text-gray-700 hover:border-gray-500 hover:text-gray-900 transition"
            >
              Continue Without Logging In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main report form ──────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Incident Report
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              All fields marked * are required
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          {/* 1. DISCLAIMER */}
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
              ⚠ Disclaimer
            </p>
            <p className="text-sm text-amber-800 leading-relaxed">
              Submitting false or misleading information regarding disasters or
              emergencies is a serious offense. Legal action may be taken
              against anyone who intentionally submits false reports.
            </p>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-amber-900">
              <input
                type="checkbox"
                checked={disclaimerAcknowledged}
                onChange={(e) => setDisclaimerAcknowledged(e.target.checked)}
                className="h-4 w-4 accent-amber-600"
              />
              I understand and acknowledge the disclaimer
            </label>
          </section>

          {/* 2. NAME */}
          <section>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly={isLoggedIn}
              placeholder="Your full name"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black transition ${
                isLoggedIn
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                  : "bg-white"
              }`}
            />
            {isLoggedIn && (
              <p className="mt-1 text-xs text-gray-400">
                Auto-filled from your account
              </p>
            )}
          </section>

          {/* 3. CONTACT */}
          <section>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contact Information <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              readOnly={isLoggedIn}
              placeholder="Phone number or email"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black transition ${
                isLoggedIn
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                  : "bg-white"
              }`}
            />
            {isLoggedIn && (
              <p className="mt-1 text-xs text-gray-400">
                Auto-filled from your account
              </p>
            )}
          </section>

          {/* 4. LOCATION */}
          <section>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            {locationLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
                <span className="animate-spin">⟳</span> Detecting location &amp; fetching address…
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    // If user edits manually, clear the GPS data
                    if (locationGranted) {
                      setLocationCoords(null);
                      setLocationAccuracy(null);
                      setLocationGranted(false);
                    }
                  }}
                  placeholder="Enter address or location manually"
                  className="flex-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={requestLocation}
                  className="shrink-0 rounded-lg border border-gray-300 px-3 py-2.5 text-xs font-medium text-gray-600 hover:border-black hover:text-black transition"
                >
                  📍 {locationGranted ? "Re-detect" : "Auto-detect"}
                </button>
              </div>
            )}
            {locationGranted && locationCoords && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  ✓ GPS detected
                </span>
                {locationAccuracy && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    ± {locationAccuracy}m accuracy
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {locationCoords.lat.toFixed(5)}, {locationCoords.lng.toFixed(5)}
                </span>
              </div>
            )}
          </section>

          {/* 5. LANDMARK */}
          <section>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nearby Landmark{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near City Park, 200m from the lighthouse"
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </section>

          {/* 6. EVENT DETAILS */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Event Details
            </h3>

            {/* Disaster type searchable dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Disaster Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={disasterType || disasterSearch}
                  onChange={(e) => {
                    setDisasterSearch(e.target.value);
                    setDisasterType("");
                    setShowDisasterDropdown(true);
                  }}
                  onFocus={() => setShowDisasterDropdown(true)}
                  placeholder="Search or select disaster type…"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                {showDisasterDropdown && filteredDisasters.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredDisasters.map((d) => (
                      <li
                        key={d}
                        onClick={() => {
                          setDisasterType(d);
                          setDisasterSearch(d);
                          setShowDisasterDropdown(false);
                        }}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {disasterType === "Other" && (
                <input
                  type="text"
                  value={customDisaster}
                  onChange={(e) => setCustomDisaster(e.target.value)}
                  placeholder="Specify the disaster type"
                  className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              )}
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Severity <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    style={
                      severity === level
                        ? {
                            backgroundColor: SEVERITY_COLORS[level],
                            borderColor: SEVERITY_COLORS[level],
                            color: "#fff",
                          }
                        : {}
                    }
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition ${
                      severity === level
                        ? "shadow-md"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {severity && (
                <p
                  className="mt-1.5 text-xs font-medium"
                  style={{ color: SEVERITY_COLORS[severity] }}
                >
                  {severity} – {SEVERITY_LABELS[severity]}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what happened, current conditions, or any additional details."
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
          </section>

          {/* 7. IMMEDIATE RESCUE */}
          <section>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={rescueRequired}
                onChange={(e) => setRescueRequired(e.target.checked)}
                className="h-4 w-4 accent-red-600"
              />
              <span>
                Immediate Rescue Required
              </span>
            </label>
            {rescueRequired && (
              <textarea
                value={rescueDetails}
                onChange={(e) => setRescueDetails(e.target.value)}
                rows={3}
                placeholder="Mention approximately how many people are stranded or injured, what assistance is needed (medical, evacuation, food, water, etc.), and any urgent information."
                className="mt-2 w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            )}
          </section>

          {/* 8. MEDIA UPLOAD */}
          <section>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Media Upload{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>

            {/* Drop zone */}
            <div
              ref={dropRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-7 text-center hover:border-black hover:bg-gray-100 transition"
            >
              <span className="text-2xl mb-1">📁</span>
              <p className="text-sm font-medium text-gray-600">
                Drag & drop files here, or{" "}
                <span className="text-black underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Images: JPG, PNG, WEBP · Videos: MP4, MOV, WEBM
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Previews */}
            {mediaPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {mediaPreviews.map((p, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-square"
                  >
                    {p.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.url}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <video
                        src={p.url}
                        className="h-full w-full object-cover"
                        muted
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-xs text-white hover:bg-black"
                    >
                      ✕
                    </button>
                    <p className="absolute bottom-0 left-0 right-0 truncate bg-black/40 px-1 py-0.5 text-[10px] text-white">
                      {p.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Error message */}
          {submitError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </p>
          )}
        </form>

        {/* ── Sticky footer ────────────────────────────────────────────────── */}
        <div className="border-t px-6 py-4">
          <button
            type="submit"
            form="" // attached via form's onSubmit
            onClick={handleSubmit}
            disabled={submitting || !disclaimerAcknowledged}
            title={!disclaimerAcknowledged ? "Please acknowledge the disclaimer first" : ""}
            className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
          {!disclaimerAcknowledged && (
            <p className="mt-2 text-center text-xs text-amber-600">
              ⚠ You must acknowledge the disclaimer before submitting
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
