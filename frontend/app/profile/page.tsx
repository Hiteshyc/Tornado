"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User, Mail, Phone, Calendar, MapPin, BadgeCheck, Lock,
  FileText, LogOut, PencilLine, Save, X, Check,
  Eye, EyeOff, Shield, Activity, Siren,
  ClipboardList, RefreshCw, Upload, Heart, Sun, Moon, ChevronRight, LayoutDashboard
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, getUserReports, uploadProfileImage } from '../libs/api';

/* ─── Types ─────────────────────────────────────────────────────── */

type Tab = 'personal' | 'emergency' | 'security' | 'reports';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
  exiting?: boolean;
}

interface PersonalData {
  name: string;
  email: string;
  mobile: string;
  dob: string;
  gender: string;
  address: string;
  role: string;
  verified: boolean;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface EmergencyData {
  bloodGroup: string;
  medicalConditions: string;
  specialAssistance: boolean;
}

interface SecurityData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFAEnabled: boolean;
  lastLogin: string;
}

interface Report {
  id: string;
  hazardType: string;
  location: string;
  date: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Verified' | 'Resolved';
}

/* ─── Data ───────────────────────────────────────────────────────── */

const INITIAL_PERSONAL: PersonalData = {
  name: 'Citizen User',
  email: 'citizen@coastal.gov.in',
  mobile: '+91 98765 43210',
  dob: '1992-07-15',
  gender: 'Male',
  address: '14, Beach Road, Panaji, North Goa – 403001',
  role: 'Citizen',
  verified: true,
  street: '14, Beach Road',
  city: 'Panaji',
  state: 'North Goa',
  zipCode: '403001',
};

const INITIAL_EMERGENCY: EmergencyData = {
  bloodGroup: 'O+',
  medicalConditions: 'None',
  specialAssistance: false,
};

const INITIAL_SECURITY: SecurityData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFAEnabled: false,
  lastLogin: '25 Jul 2026, 09:42 AM · Panaji, Goa',
};

function mapBackendReportToFrontend(r: any): Report {
  let severity: 'Low' | 'Medium' | 'High' = 'Low';
  if (r.severity >= 4) severity = 'High';
  else if (r.severity >= 3) severity = 'Medium';

  let status: 'Pending' | 'Verified' | 'Resolved' = 'Pending';
  if (r.status === 'resolved') {
    status = 'Resolved';
  } else if (r.status === 'acknowledged') {
    status = 'Verified';
  }

  let date = 'Recent';
  if (r.createdAt) {
    const d = new Date(r.createdAt);
    date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return {
    id: `#${r._id.substring(r._id.length - 4).toUpperCase()}`,
    hazardType: r.disasterType || 'Unknown',
    location: r.location || 'Unknown',
    date,
    severity,
    status,
  };
}

const SEV_CFG = {
  High: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  Medium: { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  Low: { color: '#ca8a04', bg: '#fefce8', border: '#fef08a' },
};
const STA_CFG = {
  Pending: { color: '#b45309', bg: '#fffbeb' },
  Verified: { color: '#1d4ed8', bg: '#eff6ff' },
  Resolved: { color: '#15803d', bg: '#f0fdf4' },
};

const ROLE_LABELS: Record<string, string> = {
  user: "Citizen",
  officer: "Officer",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  user: "#16a34a",
  officer: "#ca8a04",
  admin: "#dc2626",
};

/* ─── Sub-components ─────────────────────────────────────────────── */

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[1002] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl shadow-xl text-[13px] font-medium pointer-events-auto ${t.exiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} transition-all duration-300`}
          style={{
            backgroundColor: t.type === 'success' ? '#14532d' : '#7f1d1d',
            color: 'white',
            border: `1px solid ${t.type === 'success' ? '#166534' : '#991b1b'}`,
            maxWidth: 340,
          }}
        >
          {t.type === 'success'
            ? <Check size={15} className="shrink-0" />
            : <X size={15} className="shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md opacity-60 hover:opacity-100"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

function LogoutDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(5px)' }}>
      <div className="w-[340px] rounded-2xl shadow-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
            <LogOut size={18} style={{ color: '#dc2626' }} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold" style={{ color: 'var(--fg)' }}>Sign out</h3>
            <p className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>This will end your active session</p>
          </div>
        </div>
        <p className="text-[12px] mb-5 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
          Your session will be cleared and you will be redirected to the landing page.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80 active:scale-95"
            style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--fg)', border: '1px solid var(--border)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#dc2626' }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const sev = SEV_CFG[report.severity];
  const sta = STA_CFG[report.status];
  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(5px)' }}>
      <div className="w-[380px] rounded-2xl shadow-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} style={{ color: 'var(--primary)' }} />
              <h3 className="text-[14px] font-bold" style={{ color: 'var(--fg)' }}>Report {report.id}</h3>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>{report.date}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
            style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--fg-muted)' }}>
            <X size={14} />
          </button>
        </div>
        {[
          { label: 'Hazard Type', value: report.hazardType },
          { label: 'Location', value: report.location },
          { label: 'Date Submitted', value: report.date },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-2.5 text-[12px]" style={{ borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--fg-muted)' }}>{label}</span>
            <span className="font-semibold" style={{ color: 'var(--fg)' }}>{value}</span>
          </div>
        ))}
        <div className="flex justify-between py-2.5 text-[12px]" style={{ borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--fg-muted)' }}>Severity</span>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
            {report.severity}
          </span>
        </div>
        <div className="flex justify-between py-2.5 text-[12px]">
          <span style={{ color: 'var(--fg-muted)' }}>Status</span>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: sta.bg, color: sta.color }}>
            {report.status}
          </span>
        </div>
        <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: 'var(--primary)' }}>
          Close
        </button>
      </div>
    </div>
  );
}

/* ─── Field ──────────────────────────────────────────────────────── */

function Field({
  label, value, editable = false, type = 'text', readOnly = false,
  options, onChange, icon: Icon,
}: {
  label: string;
  value: string;
  editable?: boolean;
  type?: string;
  readOnly?: boolean;
  options?: string[];
  onChange?: (v: string) => void;
  icon?: React.ElementType;
}) {
  const inputStyle = {
    backgroundColor: editable && !readOnly ? 'var(--bg-hover)' : 'var(--bg-panel)',
    border: `1px solid ${editable && !readOnly ? 'var(--primary)' : 'var(--border)'}`,
    color: readOnly ? 'var(--fg-muted)' : 'var(--fg)',
    transition: 'border-color 0.2s, background-color 0.2s',
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-muted)' }}>
        {Icon && <Icon size={11} />}
        {label}
      </label>
      {options && editable && !readOnly ? (
        <select
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none"
          style={inputStyle}
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : editable && !readOnly ? (
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none"
          style={inputStyle}
        />
      ) : (
        <div className="px-3 py-2.5 rounded-lg text-[13px]" style={inputStyle}>
          {value || <span style={{ color: 'var(--fg-muted)' }}>—</span>}
        </div>
      )}
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────────────── */

function SectionHeader({ title, editing, onEdit, onSave, onCancel, saving }: {
  title: string; editing: boolean; onEdit: () => void;
  onSave: () => void; onCancel: () => void; saving?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pb-4 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <h2 className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--fg)' }}>{title}</h2>
      {!editing ? (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}
        >
          <PencilLine size={12} />
          Edit
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-80 active:scale-95"
            style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--fg)', border: '1px solid var(--border)' }}
          >
            <X size={12} /> Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}
          >
            {saving
              ? <RefreshCw size={12} className="animate-spin" />
              : <Save size={12} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────────── */

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2"
      style={{ width: 44, height: 24, backgroundColor: on ? 'var(--primary)' : 'var(--border)' }}
    >
      <span
        className="inline-block rounded-full bg-white shadow-sm transition-transform duration-300"
        style={{ width: 18, height: 18, transform: on ? 'translateX(22px)' : 'translateX(3px)' }}
      />
    </button>
  );
}

/* ─── Nav tab ────────────────────────────────────────────────────── */

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Information', Icon: User },
  { id: 'emergency', label: 'Emergency Information', Icon: Siren },
  { id: 'security', label: 'Account Security', Icon: Lock },
  { id: 'reports', label: 'Report History', Icon: ClipboardList },
];

function formatLastLogin(dateString: string | null | undefined, userAddressCity?: string, userAddressState?: string): string {
  if (!dateString) return 'No login history found';
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    const formattedDate = date.toLocaleString('en-IN', options);
    
    if (userAddressCity && userAddressState) {
      return `${formattedDate} · ${userAddressCity}, ${userAddressState}`;
    }
    return formattedDate;
  } catch (err) {
    return dateString;
  }
}

/* ─── Profile page ───────────────────────────────────────────────── */

export default function Profile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { logout, user, login } = useAuth();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (user === null) {
      router.replace('/');
    }
  }, [user, router]);

  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [editingTab, setEditingTab] = useState<Tab | null>(null);
  const [saving, setSaving] = useState(false);

  /* Read tab from query parameter on mount/load or when URL changes, and clean it up */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = searchParams.get('tab');
      if (tab === 'reports' || tab === 'personal' || tab === 'emergency' || tab === 'security') {
        setActiveTab(tab as Tab);
        
        // Strip query parameters so future manual page refreshes default to 'personal'
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, [searchParams]);

  const [personal, setPersonal] = useState(INITIAL_PERSONAL);
  const [personalDraft, setPersonalDraft] = useState(INITIAL_PERSONAL);
  const [emergency, setEmergency] = useState(INITIAL_EMERGENCY);
  const [emergencyDraft, setEmergencyDraft] = useState(INITIAL_EMERGENCY);
  const [security, setSecurity] = useState(INITIAL_SECURITY);
  const [securityDraft, setSecurityDraft] = useState(INITIAL_SECURITY);
  const [twoFA, setTwoFA] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);

  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [showLogout, setShowLogout] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});

  /* Hydrate state from user context */
  useEffect(() => {
    if (user) {
      const formattedAddress = user.address?.formattedAddress || '';
      
      const addr = user.address;
      let street = addr?.street || '';
      let city = addr?.city || '';
      let state = addr?.state || '';
      let zipCode = addr?.zipCode || '';

      // Fallback: split formattedAddress if subfields are missing
      if (!street && !city && !state && !zipCode && formattedAddress) {
        const parts = formattedAddress.split(',').map(p => p.trim());
        if (parts.length >= 4) {
          street = parts[0] || '';
          city = parts[1] || '';
          state = parts[2] || '';
          zipCode = parts[3]?.replace(/\D/g, '') || '';
        } else if (parts.length > 0) {
          // If less than 4 parts, just put everything in street
          street = formattedAddress;
        }
      }

      const initialPersonal = {
        name: user.name || 'Citizen User',
        email: user.email || '',
        mobile: user.phone || '',
        dob: user.dob || '1992-07-15', // mock defaults for un-hydration supported values
        gender: user.gender || 'Male',
        address: formattedAddress || '14, Beach Road, Panaji, North Goa – 403001',
        role: ROLE_LABELS[user.role] || 'Citizen',
        verified: user.isOnboarded || false,
        street,
        city,
        state,
        zipCode,
      };
      setPersonal(initialPersonal);
      setPersonalDraft(initialPersonal);

      const initialEmergency = {
        bloodGroup: user.emergency?.bloodGroup || 'O+',
        medicalConditions: user.emergency?.medicalConditions || 'None',
        specialAssistance: user.emergency?.specialAssistance || false,
      };
      setEmergency(initialEmergency);
      setEmergencyDraft(initialEmergency);

      const initialSecurity = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFAEnabled: false,
        lastLogin: formatLastLogin(user.lastLogin, user.address?.city, user.address?.state),
      };
      setSecurity(initialSecurity);
      setSecurityDraft(initialSecurity);

      // Hydrate user reports
      getUserReports(user.id)
        .then((res: any) => {
          if (res?.success && Array.isArray(res.reports)) {
            setReports(res.reports.map(mapBackendReportToFrontend));
          }
        })
        .catch((err: any) => {
          console.warn("[Profile] Failed to fetch user reports:", err);
        });
    }
  }, [user]);

  /* ── Toasts ── */
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x));
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 360);
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(t => t.map(x => x.id === id ? { ...x, exiting: true } : x));
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 360);
  }, []);

  /* ── Avatar upload ── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      return addToast('error', 'Invalid file type. Accepted: JPG, PNG, WEBP.');
    }
    if (file.size > 5 * 1024 * 1024) {
      return addToast('error', 'File exceeds 5 MB limit.');
    }
    
    if (!user) return addToast('error', 'You must be logged in to upload an image.');

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("profileImage", file);
      
      const res = await uploadProfileImage(user.id, formData);
      if (res && res.user && res.user.profileImage) {
        setAvatar(res.user.profileImage);
        addToast('success', 'Profile picture updated.');
        login(res.user); // Update context with new user data containing the image URL
      } else {
        throw new Error("Failed to upload image.");
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  /* ── Edit helpers ── */
  const startEdit = (tab: Tab) => {
    setEditingTab(tab);
    if (tab === 'personal') setPersonalDraft({ ...personal });
    if (tab === 'emergency') setEmergencyDraft({ ...emergency });
    if (tab === 'security') setSecurityDraft({ ...security, currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const cancelEdit = () => setEditingTab(null);

  const saveEdit = async (tab: Tab) => {
    if (!user) return;
    setSaving(true);
    const userId = user.id;
    try {
      if (tab === 'personal') {
        const payload = {
          name: personalDraft.name,
          phone: personalDraft.mobile,
          dob: personalDraft.dob,
          gender: personalDraft.gender,
          address: {
            street: personalDraft.street || "",
            city: personalDraft.city || "",
            state: personalDraft.state || "",
            zipCode: personalDraft.zipCode || "",
            formattedAddress: `${personalDraft.street || ""}, ${personalDraft.city || ""}, ${personalDraft.state || ""}, ${personalDraft.zipCode || ""}`
          }
        };
        const res = await updateUserProfile(userId, payload);
        const updatedAddress = res.user?.address?.formattedAddress || `${personalDraft.street || ""}, ${personalDraft.city || ""}, ${personalDraft.state || ""}, ${personalDraft.zipCode || ""}`;
        setPersonal({ ...personalDraft, address: updatedAddress });
        if (res.user) login(res.user);
      }
      if (tab === 'emergency') {
        const payload = {
          emergency: {
            bloodGroup: emergencyDraft.bloodGroup,
            medicalConditions: emergencyDraft.medicalConditions,
            specialAssistance: emergencyDraft.specialAssistance,
          }
        };
        const res = await updateUserProfile(userId, payload);
        setEmergency({ ...emergencyDraft });
        if (res.user) login(res.user);
      }
      if (tab === 'security') {
        if (securityDraft.newPassword && securityDraft.newPassword !== securityDraft.confirmPassword) {
          addToast('error', 'New passwords do not match.');
          setSaving(false);
          return;
        }
        
        if (securityDraft.newPassword) {
          const payload = { password: securityDraft.newPassword };
          await updateUserProfile(userId, payload);
          // Reset password fields after successful save
          setSecurityDraft({ ...security, currentPassword: '', newPassword: '', confirmPassword: '' });
        }
      }
      addToast('success', 'Changes saved successfully.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
      setEditingTab(null);
    }
  };

  const changeTab = (tab: Tab) => { setEditingTab(null); setActiveTab(tab); };
  const isEditing = (tab: Tab) => editingTab === tab;

  const handleTwoFA = (v: boolean) => {
    setTwoFA(v);
    addToast('success', v ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.');
  };

  /* ── Keyboard ── */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedReport(null); setShowLogout(false); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      {showLogout && <LogoutDialog onConfirm={async () => { setShowLogout(false); await logout(); router.push('/'); }} onCancel={() => setShowLogout(false)} />}
      {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
      <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden mx-auto w-full">
        {/* ── Left Card ────────────────────────────────────────── */}
        <aside
          className="w-[240px] shrink-0 flex flex-col"
          style={{ backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border)', overflowY: 'auto' }}
        >
          {/* Avatar */}
          <div className="flex flex-col items-center pt-8 pb-6 px-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="relative mb-4 group">
              <div
                className="rounded-full overflow-hidden ring-0 group-hover:ring-4 transition-all duration-300 flex items-center justify-center text-2xl font-bold text-white select-none"
                style={{ width: 86, height: 86, backgroundColor: 'var(--primary)', '--tw-ring-color': 'var(--ring)' } as React.CSSProperties}
              >
                {uploading ? (
                  <RefreshCw size={26} className="animate-spin" style={{ color: 'white' }} />
                ) : avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : user?.name ? (
                  user.name[0].toUpperCase()
                ) : (
                  <User size={38} style={{ color: 'white' }} strokeWidth={1.5} />
                )}
              </div>

              {/* Edit overlay */}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                style={{ background: 'rgba(0,0,0,0.42)' }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={18} style={{ color: 'white' }} />
              </div>

              {/* Edit badge */}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: 'var(--primary)', border: '2px solid var(--bg-card)', color: 'white' }}
                title="Change photo"
              >
                <PencilLine size={10} />
              </button>
            </div>

            <h2 className="text-[14px] font-bold text-center leading-snug" style={{ color: 'var(--fg)' }}>
              {personal.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: user ? ROLE_COLORS[user.role] + "22" : "#eff6ff",
                  color: user ? ROLE_COLORS[user.role] : "#1d4ed8",
                  border: `1px solid ${user ? ROLE_COLORS[user.role] + "44" : "#bfdbfe"}`
                }}>
                {personal.role}
              </span>
              {personal.verified && (
                <BadgeCheck size={15} style={{ color: '#16a34a' }} />
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 flex flex-col gap-1">
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => changeTab(id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.985]"
                  style={active
                    ? { backgroundColor: 'var(--primary)', color: 'var(--primary-fg)', boxShadow: 'var(--shadow)' }
                    : { color: 'var(--fg)' }}
                >
                  <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="text-[12px] font-medium flex-1 truncate">{label}</span>
                  {id === 'reports' && (
                    <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'var(--bg-hover)', color: active ? 'white' : 'var(--fg-muted)' }}>
                      {reports.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Back to Dashboard */}
          <div className="px-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.985]"
              style={{ color: 'var(--fg-muted)', border: '1px dashed var(--border)' }}
            >
              <LayoutDashboard size={14} className="shrink-0" />
              <span className="text-[12px] font-semibold flex-1 truncate">Back to Dashboard</span>
            </button>
          </div>

          {/* Logout */}
          <div className="p-3">
            <button
              onClick={() => setShowLogout(true)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full text-left transition-all hover:scale-[1.015] active:scale-[0.985]"
              style={{ backgroundColor: isDark ? '#2d0a0a' : '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              <LogOut size={14} />
              <span className="text-[12px] font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-7">
          {/* Personal Information */}
          {activeTab === 'personal' && (
            <div className="max-w-xl transition-all duration-300">
              <SectionHeader
                title="Personal Information"
                editing={isEditing('personal')}
                onEdit={() => startEdit('personal')}
                onSave={() => saveEdit('personal')}
                onCancel={cancelEdit}
                saving={saving}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" icon={User} value={isEditing('personal') ? personalDraft.name : personal.name}
                  editable={isEditing('personal')} onChange={v => setPersonalDraft(d => ({ ...d, name: v }))} />
                <Field label="Email Address" icon={Mail} value={isEditing('personal') ? personalDraft.email : personal.email}
                  editable={isEditing('personal')} type="email" onChange={v => setPersonalDraft(d => ({ ...d, email: v }))} />
                <Field label="Mobile Number" icon={Phone} value={isEditing('personal') ? personalDraft.mobile : personal.mobile}
                  editable={isEditing('personal')} onChange={v => setPersonalDraft(d => ({ ...d, mobile: v }))} />
                <Field label="Date of Birth" icon={Calendar} value={isEditing('personal') ? personalDraft.dob : personal.dob}
                  editable={isEditing('personal')} type="date" onChange={v => setPersonalDraft(d => ({ ...d, dob: v }))} />
                <Field label="Gender" value={isEditing('personal') ? personalDraft.gender : personal.gender}
                  editable={isEditing('personal')} options={['Male', 'Female', 'Non-binary', 'Prefer not to say']}
                  onChange={v => setPersonalDraft(d => ({ ...d, gender: v }))} />
                <Field label="Role" icon={BadgeCheck} value={personal.role} readOnly disabled />
                {!isEditing('personal') ? (
                  <div className="col-span-2">
                    <Field label="Address" icon={MapPin} value={personal.address} readOnly />
                  </div>
                ) : (
                  <>
                    <div className="col-span-2">
                      <Field label="Street Address" icon={MapPin} value={personalDraft.street || ''}
                        editable={true} onChange={v => setPersonalDraft(d => ({ ...d, street: v }))} />
                    </div>
                    <Field label="City" value={personalDraft.city || ''}
                      editable={true} onChange={v => setPersonalDraft(d => ({ ...d, city: v }))} />
                    <Field label="State" value={personalDraft.state || ''}
                      editable={true} onChange={v => setPersonalDraft(d => ({ ...d, state: v }))} />
                    <div className="col-span-2">
                      <Field label="Zip Code" value={personalDraft.zipCode || ''}
                        editable={true} onChange={v => setPersonalDraft(d => ({ ...d, zipCode: v }))} />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                    <BadgeCheck size={11} /> Verification Status
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-semibold"
                    style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                    <BadgeCheck size={14} />
                    Verified — Managed by system administration
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Information */}
          {activeTab === 'emergency' && (
            <div className="max-w-xl transition-all duration-300">
              <SectionHeader
                title="Emergency Information"
                editing={isEditing('emergency')}
                onEdit={() => startEdit('emergency')}
                onSave={() => saveEdit('emergency')}
                onCancel={cancelEdit}
                saving={saving}
              />
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-[12px]"
                style={{ backgroundColor: isDark ? '#431407' : '#fff7ed', border: '1px solid #fed7aa', color: isDark ? '#fdba74' : '#9a3412' }}>
                <Siren size={14} className="shrink-0 mt-0.5" />
                This information is shared with emergency responders during rescue operations. Keep it accurate.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" icon={User} value={personal.name} readOnly disabled />
                <Field label="Mobile Number" icon={Phone} value={personal.mobile} readOnly disabled />
                <Field label="Blood Group" icon={Heart} value={isEditing('emergency') ? emergencyDraft.bloodGroup : emergency.bloodGroup}
                  editable={isEditing('emergency')} options={['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']}
                  onChange={v => setEmergencyDraft(d => ({ ...d, bloodGroup: v }))} />
                <div className="col-span-2">
                  <Field label="Medical Conditions" icon={Activity} value={isEditing('emergency') ? emergencyDraft.medicalConditions : emergency.medicalConditions}
                    editable={isEditing('emergency')} onChange={v => setEmergencyDraft(d => ({ ...d, medicalConditions: v }))} />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--fg-muted)' }}>
                    <Shield size={11} /> Special Assistance
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isEditing('emergency') ? emergencyDraft.specialAssistance : emergency.specialAssistance}
                      onChange={e => isEditing('emergency') && setEmergencyDraft(d => ({ ...d, specialAssistance: e.target.checked }))}
                      disabled={!isEditing('emergency')}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span className="text-[13px]" style={{ color: 'var(--fg)' }}>
                      I require special assistance during emergency evacuation
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Account Security */}
          {activeTab === 'security' && (
            <div className="max-w-xl transition-all duration-300">
              <SectionHeader
                title="Account Security"
                editing={isEditing('security')}
                onEdit={() => startEdit('security')}
                onSave={() => saveEdit('security')}
                onCancel={cancelEdit}
                saving={saving}
              />

              {/* Change password card */}
              <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={14} style={{ color: 'var(--primary)' }} />
                  <h3 className="text-[13px] font-bold" style={{ color: 'var(--fg)' }}>Change Password</h3>
                </div>
                <div className="flex flex-col gap-3.5">
                  {[
                    { key: 'currentPassword', label: 'Current Password', editMode: false },
                    { key: 'newPassword', label: 'New Password', editMode: true },
                    { key: 'confirmPassword', label: 'Confirm New Password', editMode: true },
                  ]
                  .filter(f => f.editMode === isEditing('security'))
                  .map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                        {label}
                      </label>
                      <div className="relative">
                        <input
                          type={!isEditing('security') ? 'password' : (showPwd[key] ? 'text' : 'password')}
                          value={!isEditing('security') ? '........' : (securityDraft[key as keyof SecurityData] as string)}
                          onChange={e => setSecurityDraft(d => ({ ...d, [key]: e.target.value }))}
                          disabled={!isEditing('security')}
                          placeholder={isEditing('security') ? '••••••••' : ''}
                          className="w-full px-3 py-2.5 pr-10 rounded-lg text-[13px] outline-none"
                          style={{
                            backgroundColor: isEditing('security') ? 'var(--bg-hover)' : 'var(--bg-panel)',
                            border: `1px solid ${isEditing('security') ? 'var(--primary)' : 'var(--border)'}`,
                            color: 'var(--fg)',
                            transition: 'border-color 0.2s',
                          }}
                        />
                        {isEditing('security') && (
                          <button
                            type="button"
                            onClick={() => setShowPwd(s => ({ ...s, [key]: !s[key] }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                            style={{ color: 'var(--fg-muted)' }}
                          >
                            {showPwd[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2FA card */}
              <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: twoFA ? (isDark ? '#1e3a5f' : '#eff6ff') : 'var(--bg-hover)' }}>
                      <Shield size={16} style={{ color: twoFA ? 'var(--primary)' : 'var(--fg-muted)' }} />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold" style={{ color: 'var(--fg)' }}>
                        Two-Factor Authentication
                      </h3>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                        {twoFA ? 'Enabled — your account has extra protection' : 'Adds a second verification step at login'}
                      </p>
                    </div>
                  </div>
                  <Toggle on={twoFA} onChange={handleTwoFA} />
                </div>
              </div>

              {/* Last login card */}
              <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} style={{ color: 'var(--primary)' }} />
                  <h3 className="text-[13px] font-bold" style={{ color: 'var(--fg)' }}>Last Login</h3>
                  <span className="text-[10px] ml-auto uppercase tracking-wide font-medium px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--fg-muted)' }}>
                    Read-only
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
                    <Check size={13} style={{ color: '#16a34a' }} />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold" style={{ color: 'var(--fg)' }}>Successful</div>
                    <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>{security.lastLogin}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

           {/* Report History */}
           {activeTab === 'reports' && (
             <div className="transition-all duration-300">
               <div className="flex items-center justify-between pb-4 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                 <h2 className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Report History</h2>
                 <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                   style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--fg-muted)' }}>
                   {reports.length} submissions
                 </span>
               </div>
 
               {/* Stats */}
               <div className="grid grid-cols-3 gap-3 mb-5">
                 {[
                   { label: 'Total', value: reports.length, color: '#1d4ed8', bg: isDark ? '#1e3a5f' : '#eff6ff', border: '#bfdbfe' },
                   { label: 'Verified', value: reports.filter(r => r.status === 'Verified').length, color: '#15803d', bg: isDark ? '#052e16' : '#f0fdf4', border: '#bbf7d0' },
                   { label: 'Pending', value: reports.filter(r => r.status === 'Pending').length, color: '#b45309', bg: isDark ? '#3d1a00' : '#fffbeb', border: '#fde68a' },
                 ].map(s => (
                   <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
                     <div className="text-[22px] font-black" style={{ color: s.color }}>{s.value}</div>
                     <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: s.color + 'bb' }}>{s.label}</div>
                   </div>
                 ))}
               </div>
 
               {/* Table */}
               <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                 {/* Header */}
                 <div
                   className="grid text-[10px] font-bold uppercase tracking-widest px-4 py-3"
                   style={{
                     gridTemplateColumns: '90px 1fr 1fr 105px 85px 85px',
                     backgroundColor: 'var(--bg-hover)',
                     borderBottom: '1px solid var(--border)',
                     color: 'var(--fg-muted)',
                   }}
                 >
                   <span>ID</span>
                   <span>Hazard</span>
                   <span>Location</span>
                   <span>Date</span>
                   <span>Severity</span>
                   <span>Status</span>
                 </div>
 
                 {reports.length === 0 ? (
                   <div className="text-center py-10 text-[13px] font-medium" style={{ color: 'var(--fg-muted)', backgroundColor: 'var(--bg-card)' }}>
                     No reports submitted yet.
                   </div>
                 ) : (
                   reports.map((r, i) => {
                     const sev = SEV_CFG[r.severity];
                     const sta = STA_CFG[r.status];
                     return (
                       <button
                         key={r.id}
                         onClick={() => setSelectedReport(r)}
                         className="grid w-full px-4 py-3 text-left text-[12px] transition-all"
                         style={{
                           gridTemplateColumns: '90px 1fr 1fr 105px 85px 85px',
                           borderBottom: i < reports.length - 1 ? '1px solid var(--border)' : 'none',
                           backgroundColor: 'var(--bg-card)',
                         }}
                         onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
                         onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card)'; }}
                       >
                         <span className="font-mono font-bold text-[11px]" style={{ color: 'var(--primary)' }}>{r.id}</span>
                         <span className="font-medium" style={{ color: 'var(--fg)' }}>{r.hazardType}</span>
                         <span className="truncate pr-2" style={{ color: 'var(--fg-muted)' }}>{r.location}</span>
                         <span className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>{r.date}</span>
                         <span>
                           <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                             style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                             {r.severity}
                           </span>
                         </span>
                         <span>
                           <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                             style={{ backgroundColor: sta.bg, color: sta.color }}>
                             {r.status}
                           </span>
                         </span>
                       </button>
                     );
                   })
                 )}
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
