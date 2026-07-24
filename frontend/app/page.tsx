/**
 * page.tsx
 *
 * Root page of the application ( "/" route ).
 *
 * This is the main entry point for all users — both guests and logged-in
 * users land here. The Navbar (rendered by layout.tsx) handles the
 * authentication state, so this page only needs to render the app content.
 *
 * Current state (husk phase):
 *   A placeholder shell is rendered so the Navbar can be tested in isolation.
 *
 * Next phase:
 *   Replace the placeholder <div> with the actual <MapSection> and
 *   <ActionPanel> components ported from the reference design.
 */

export default function Home() {
  return (
    /**
     * Outer container — `flex-1` ensures this div expands to fill all
     * vertical space below the Navbar (which is rendered in layout.tsx).
     * `relative` is needed later for absolutely-positioned map overlays.
     */
    <div
      className="flex-1 flex items-center justify-center relative"
      style={{ background: "var(--bg)" }}
    >
      {/*
       * Placeholder content — visually confirms the design token system and
       * Navbar are working correctly.
       * Remove and replace with <MapSection /> in the map phase.
       */}
      <div
        className="text-center space-y-2 anim-fade-up"
        style={{ color: "var(--fg-muted)" }}
      >
        <p className="font-mono text-xs uppercase tracking-widest">
          Map & Dashboard
        </p>
        <p className="text-sm" style={{ color: "var(--fg)" }}>
          Content coming in the next phase
        </p>
      </div>
    </div>
  );
}
