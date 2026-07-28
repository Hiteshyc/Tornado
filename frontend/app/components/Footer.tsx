"use client";

import { Phone } from "lucide-react";

const contacts = [
  { label: "Police", number: "100" },
  { label: "Fire", number: "101" },
  { label: "Ambulance", number: "108" },
  { label: "Disaster Control", number: "1077" },
  { label: "Coast Guard", number: "1554" },
  { label: "Women Helpline", number: "1091" },
];

/**
 * Footer
 *
 * Global footer component displaying emergency helpline speed-dial contacts
 * and legal resource links. Fits into the bottom margin of the layout context.
 */
export default function Footer() {
  return (
    <footer
      className="shrink-0 border-t flex items-center justify-between px-4 transition-colors duration-150"
      style={{
        height: "2.25rem",
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      {/* Emergency contacts speed dial */}
      <div className="flex items-center gap-0.5">
        <Phone size={10} style={{ color: "var(--accent)" }} className="mr-1.5 shrink-0" />
        <div className="flex items-center gap-px">
          {contacts.map((c, i) => (
            <span key={c.number} className="flex items-center">
              <a
                href={`tel:${c.number}`}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded hover:underline underline-offset-2 transition-colors"
                style={{ color: "var(--fg-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
              >
                <span className="font-medium" style={{ color: "var(--fg)" }}>{c.label}</span>{" "}
                <span style={{ color: "var(--accent)" }}>{c.number}</span>
              </a>
              {i < contacts.length - 1 && (
                <span className="text-[10px] select-none" style={{ color: "var(--border-strong)" }}>·</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Auxiliary Links & Legal Info */}
      <div className="hidden md:flex items-center gap-3">
        {["About", "Contact", "Privacy", "Terms"].map((link) => (
          <button
            key={link}
            className="text-[10px] cursor-pointer transition-colors"
            style={{ color: "var(--fg-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
          >
            {link}
          </button>
        ))}
        <span className="text-[10px] opacity-60" style={{ color: "var(--border-strong)" }}>|</span>
        <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
          © 2026 NDMA India
        </span>
      </div>
    </footer>
  );
}
