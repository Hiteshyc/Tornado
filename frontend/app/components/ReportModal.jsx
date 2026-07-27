"use client";

import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DISASTER_TYPES = [
  "Avalanche",
  "Biological Hazard",
  "Blizzard",
  "Building Collapse",
  "Bushfire",
  "Chemical Spill",
  "Civil Unrest",
  "Coastal Erosion",
  "Coastal Flooding",
  "Cold Wave",
  "Cyclone",
  "Cyberattack (Critical Infrastructure)",
  "Dam Failure",
  "Debris Flow",
  "Desertification",
  "Drought",
  "Dust Storm",
  "Earthquake",
  "Epidemic",
  "Explosion",
  "Extreme Heat",
  "Famine",
  "Fire (Urban Fire)",
  "Flash Flood",
  "Flood",
  "Forest Fire",
  "Gas Leak",
  "Glacial Lake Outburst Flood (GLOF)",
  "Ground Subsidence",
  "Hailstorm",
  "Harmful Algal Bloom",
  "Heatwave",
  "Hurricane",
  "Ice Storm",
  "Industrial Accident",
  "Infectious Disease Outbreak",
  "Jellyfish Bloom",
  "Kidnapping Crisis",
  "Landslide",
  "Lava Flow",
  "Lightning Strike",
  "Locust Infestation",
  "Marine Pollution",
  "Mine Collapse",
  "Mudslide",
  "Nuclear Accident",
  "Oil Spill",
  "Pandemic",
  "Power Grid Failure",
  "Quicksand Incident",
  "Radiation Leak",
  "Rail Accident",
  "River Flood",
  "Road Accident",
  "Rockfall",
  "Sabotage",
  "Sandstorm",
  "Severe Storm",
  "Sinkhole",
  "Snowstorm",
  "Stampede",
  "Storm Surge",
  "Structural Collapse",
  "Terrorist Attack",
  "Thunderstorm",
  "Tornado",
  "Toxic Gas Release",
  "Transportation Accident",
  "Tsunami",
  "Typhoon",
  "Urban Fire",
  "Volcanic Ashfall",
  "Volcanic Eruption",
  "Water Contamination",
  "Wildfire",
  "Windstorm",
  "Zoological Outbreak",
  "Zoonotic Disease Outbreak",
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
  1: "#1B5E20", // 1 - Dark Forest Green
  2: "#689F38", // 2 - Lime / Light Olive Green
  3: "#FDD835", // 3 - Vivid Warning Yellow
  4: "#FB8C00", // 4 - Vivid Emergency Orange
  5: "#B71C1C", // 5 - Dark Emergency Red
};

const SEVERITY_TEXT_COLORS = {
  1: "#ffffff",
  2: "#ffffff",
  3: "#1a1a1a", // Dark text on bright yellow for high contrast
  4: "#ffffff",
  5: "#ffffff",
};

const SEVERITY_BG_LIGHT = {
  1: "#e8f5e9",
  2: "#f1f8e9",
  3: "#fffde7",
  4: "#fff3e0",
  5: "#ffebee",
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
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

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
  const errorRef = useRef(null);

  // Disclaimer
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState("");

  // Auto-scroll to error message whenever submitError is set
  useEffect(() => {
    if (submitError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [submitError]);

  // Disaster dropdown filtered list
  const filteredDisasters = DISASTER_TYPES.filter((d) =>
    d.toLowerCase().includes(disasterSearch.toLowerCase()),
  );

  // ── Effects ───────────────────────────────────────────────────────────────

  // Auto-fill name, phone, email from currentUser when logged in
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
      setEmail(currentUser.email || "");
    }
  }, [currentUser]);

  // Auto-skip gate if user is logged in
  useEffect(() => {
    if (isOpen) {
      setStep(isLoggedIn ? "form" : "gate");
    }
  }, [isOpen, isLoggedIn]);

  // Automatically request geolocation when form step mounts
  useEffect(() => {
    if (step === "form" && !locationGranted && !location) {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Draft auto-save key ──────────────────────────────────────────────────
  const DRAFT_KEY = "ws_report_form_draft";

  // Restore draft from localStorage on initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (!currentUser && draft.name) setName(draft.name);
        if (!currentUser && draft.phone) setPhone(draft.phone);
        if (!currentUser && draft.email) setEmail(draft.email);
        if (draft.location) {
          setLocation(draft.location);
          setLocationGranted(true);
        }
        if (draft.locationCoords) setLocationCoords(draft.locationCoords);
        if (draft.locationAccuracy) setLocationAccuracy(draft.locationAccuracy);
        if (draft.landmark) setLandmark(draft.landmark);
        if (draft.disasterType) setDisasterType(draft.disasterType);
        if (draft.customDisaster) setCustomDisaster(draft.customDisaster);
        if (draft.severity) setSeverity(draft.severity);
        if (draft.description) setDescription(draft.description);
        if (typeof draft.rescueRequired === "boolean") setRescueRequired(draft.rescueRequired);
        if (draft.rescueDetails) setRescueDetails(draft.rescueDetails);
        if (typeof draft.disclaimerAcknowledged === "boolean")
          setDisclaimerAcknowledged(draft.disclaimerAcknowledged);
      }
    } catch {}
  }, [currentUser]);

  // Auto-save form fields to localStorage whenever state changes
  useEffect(() => {
    // Only save if there's active content to preserve
    if (
      location ||
      landmark ||
      disasterType ||
      severity ||
      description ||
      rescueRequired ||
      disclaimerAcknowledged ||
      (!isLoggedIn && (name || phone || email))
    ) {
      try {
        const draftData = {
          name: !isLoggedIn ? name : undefined,
          phone: !isLoggedIn ? phone : undefined,
          email: !isLoggedIn ? email : undefined,
          location,
          locationCoords,
          locationAccuracy,
          landmark,
          disasterType,
          customDisaster,
          severity,
          description,
          rescueRequired,
          rescueDetails,
          disclaimerAcknowledged,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      } catch {}
    }
  }, [
    isLoggedIn,
    name,
    phone,
    email,
    location,
    locationCoords,
    locationAccuracy,
    landmark,
    disasterType,
    customDisaster,
    severity,
    description,
    rescueRequired,
    rescueDetails,
    disclaimerAcknowledged,
  ]);

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

  // Smart progressive geocoder for manually typed addresses + optional landmark
  async function searchAddressGeocode(rawAddress, optionalLandmark = "") {
    if (!rawAddress || rawAddress.trim().length < 3) return null;

    const queriesToTry = [];
    const fullAddress = optionalLandmark.trim()
      ? `${optionalLandmark.trim()}, ${rawAddress.trim()}`
      : rawAddress.trim();

    // 1) Try landmark + location together first if landmark is provided
    if (optionalLandmark.trim()) {
      queriesToTry.push(fullAddress);
    }

    // 2) Try full location address next
    const parts = rawAddress.split(",").map((p) => p.trim()).filter(Boolean);
    queriesToTry.push(parts.join(", "));

    // 3) Progressively drop leading specific names (building/apartment names)
    for (let i = 1; i < parts.length; i++) {
      queriesToTry.push(parts.slice(i).join(", "));
    }

    for (const query of queriesToTry) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
          { headers: { "Accept-Language": "en" } },
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            return {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            };
          }
        }
      } catch {
        // Try next fallback level
      }
    }
    return null;
  }

  // Geocode typed address whenever location or landmark changes manually
  useEffect(() => {
    if (!location || locationGranted) return;

    const timer = setTimeout(async () => {
      const coords = await searchAddressGeocode(location, landmark);
      if (coords) {
        setLocationCoords(coords);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [location, landmark, locationGranted]);

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
  const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30 MB

  function handleFileSelect(e) {
    addFiles(Array.from(e.target.files));
  }

  function addFiles(incoming) {
    const allowed = incoming.filter((f) =>
      /image\/(jpeg|jpg|png|webp)|video\/(mp4|quicktime|webm)/.test(f.type),
    );

    const oversized = allowed.filter((f) => f.size > MAX_TOTAL_SIZE);
    if (oversized.length > 0) {
      setSubmitError(`Some files exceed the 30MB size limit.`);
    }

    const validFiles = allowed.filter((f) => f.size <= MAX_TOTAL_SIZE);
    setMediaFiles((prev) => [...prev, ...validFiles]);
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
    setPhone(isLoggedIn ? currentUser?.phone || "" : "");
    setEmail(isLoggedIn ? currentUser?.email || "" : "");
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
    setSubmittedReportId("");
    setSubmitting(false);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  // ── Validation & Submit ───────────────────────────────────────────────────
  function validate() {
    if (!disclaimerAcknowledged) return "Please acknowledge the disclaimer.";
    if (!name.trim()) return "Full name is required.";
    if (!phone.trim()) return "Phone number is required.";
    if (!/^[0-9+\-\s]{7,15}$/.test(phone.trim())) return "Enter a valid phone number.";
    if (!location.trim()) return "Location is required.";
    if (!disasterType && !customDisaster)
      return "Please specify the disaster type.";
    if (!severity) return "Severity rating is required.";

    // Check media file sizes
    const totalSize = mediaFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return "Total media size cannot exceed 30MB.";
    }

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

    // Build payload — backend reads reporter info from req.user (logged-in) or falls back to these fields
    const payload = {
      // Reporter fields (sent as fallback in case authentication is not present)
      guestName:    name || undefined,
      guestContact: phone || undefined,
      guestEmail:   email || undefined,
      // Location
      location,
      locationCoords:   locationCoords || null,
      locationAccuracy: locationAccuracy || null,
      landmark:         landmark || null,
      // Incident
      disasterType: disasterType === "Other" ? customDisaster : disasterType,
      severity,
      description:    description || null,
      rescueRequired,
      rescueDetails:  rescueRequired ? rescueDetails || null : null,
    };

    // Build FormData — send JSON payload as "data" field + files as "media"
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    mediaFiles.forEach((file) => formData.append("media", file));

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        // Do NOT set Content-Type — browser sets it automatically with the multipart boundary
        body: formData,
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 413) {
          setSubmitError("The uploaded media exceeds the maximum allowed size (30MB).");
        } else if (res.status === 500) {
          setSubmitError("Server error occurred while processing your report. Please try again shortly.");
        } else if (res.status === 401 || res.status === 403) {
          setSubmitError("Session authorization issue. Please try logging in again or submitting as a guest.");
        } else {
          setSubmitError(data.message || `Failed to submit report (Status code ${res.status}). Please try again.`);
        }
        return;
      }

      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      if (data.reportId) {
        setSubmittedReportId(data.reportId);
      }
      setSubmitSuccess(true);
    } catch (err) {
      if (!navigator.onLine) {
        setSubmitError("You are currently offline. Please check your internet connection and try again.");
      } else if (err.name === "AbortError") {
        setSubmitError("The upload request timed out due to a slow connection. Please try again.");
      } else {
        setSubmitError("Unable to connect to the server. Please check your internet connection or try again shortly.");
      }
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
        onClick={handleClose}
      >
        <div
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />

          {/* Animated Success Badge */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border-8 border-emerald-100/60 shadow-inner">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Report Submitted
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Thank you for taking action. Emergency dispatch teams have been notified and will process your incident report immediately.
          </p>

          {/* Incident Reference Card */}
          {submittedReportId && (
            <div className="mb-6 rounded-2xl bg-gray-50 p-4 border border-gray-200/80 text-left">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">Incident Ref ID</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 text-[10px]">
                  ● PENDING REVIEW
                </span>
              </div>
              <p className="font-mono text-sm font-bold text-gray-900 tracking-wide select-all">
                {submittedReportId}
              </p>
            </div>
          )}

          <button
            onClick={handleClose}
            className="w-full rounded-xl bg-gray-950 py-3.5 text-sm font-bold text-white shadow-lg shadow-gray-950/20 hover:bg-gray-800 transition active:scale-[0.98]"
          >
            Done
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
          {/* Top error banner */}
          {submitError && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-sm mt-0.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-red-900 mb-0.5">Attention Required</p>
                <p className="text-sm font-medium text-red-700 leading-snug">{submitError}</p>
              </div>
            </div>
          )}
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
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
              readOnly={isLoggedIn}
              placeholder="Your full name (letters only)"
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

          {/* 3. PHONE */}
          <section>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\-\s]/g, ""))}
              readOnly={isLoggedIn}
              placeholder="e.g. 9876543210 (digits only)"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black transition ${
                isLoggedIn
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                  : "bg-white"
              }`}
            />
            {isLoggedIn && (
              <p className="mt-1 text-xs text-gray-400">Auto-filled from your account</p>
            )}
          </section>

          {/* 3b. EMAIL (optional) */}
          <section>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={isLoggedIn}
              placeholder="your@email.com"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black transition ${
                isLoggedIn
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                  : "bg-white"
              }`}
            />
            {isLoggedIn && (
              <p className="mt-1 text-xs text-gray-400">Auto-filled from your account</p>
            )}
          </section>

          {/* 4. LOCATION */}
          <section>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>

            {/* Show consent note for logged-in users who have denied location access */}
            {isLoggedIn && currentUser?.locationConsent === false && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span className="mt-0.5 shrink-0">ℹ️</span>
                <span>
                  Location access is disabled in your account settings. Please enter your location manually — coordinates will be resolved automatically from the address.
                </span>
              </div>
            )}

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
                    const val = e.target.value;
                    setLocation(val);
                    // Clear GPS lock & accuracy so typed address is geocoded cleanly
                    setLocationGranted(false);
                    setLocationAccuracy(null);
                  }}
                  placeholder={
                    isLoggedIn && currentUser?.locationConsent === false
                      ? "Enter address (e.g. Ganeshpuri, Mapusa, Goa)"
                      : "Enter address or location manually"
                  }
                  className="flex-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                {/* Show GPS button only when consent is true or user is a guest */}
                {(!isLoggedIn || currentUser?.locationConsent === true) && (
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-2.5 text-xs font-medium text-gray-600 hover:border-black hover:text-black transition"
                  >
                    📍 {locationGranted ? "Re-detect" : "Auto-detect"}
                  </button>
                )}
              </div>
            )}
            {locationCoords && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {locationGranted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    ✓ GPS detected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    🔍 Geocoded from address
                  </span>
                )}
                {locationGranted && locationAccuracy && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    ± {locationAccuracy}m accuracy
                  </span>
                )}
                <span className="text-xs text-gray-400 font-mono">
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
              onBlur={async () => {
                if (location && !locationGranted) {
                  const coords = await searchAddressGeocode(location, landmark);
                  if (coords) setLocationCoords(coords);
                }
              }}
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
                            color: SEVERITY_TEXT_COLORS[level],
                          }
                        : {
                            backgroundColor: SEVERITY_BG_LIGHT[level],
                            borderColor: `${SEVERITY_COLORS[level]}50`,
                            color: level === 3 ? "#856404" : SEVERITY_COLORS[level],
                          }
                    }
                    className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-bold transition-all ${
                      severity === level
                        ? "shadow-md scale-105"
                        : "opacity-80 hover:opacity-100"
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

          {/* Error message with auto-scroll ref */}
          {submitError && (
            <div
              ref={errorRef}
              className="flex items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 p-4 shadow-sm backdrop-blur-sm"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-sm mt-0.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-red-900 mb-0.5">Attention Required</p>
                <p className="text-sm font-medium text-red-700 leading-snug">{submitError}</p>
              </div>
            </div>
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
