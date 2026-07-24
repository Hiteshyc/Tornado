import AuthButton from "../components/AuthButton";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top nav bar */}
      <header className="flex items-center justify-between border-b border-white/10 bg-gray-900 px-6 py-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">
            🌪 Tornado
          </span>
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
            Dashboard
          </span>
        </div>
        <AuthButton />
      </header>

      {/* Page body — dashboard content will be built here */}
      <main className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <p className="text-4xl font-bold text-white">Welcome back 👋</p>
        <p className="text-sm text-gray-400">
          Your dashboard is being built. Use the Report button to submit an incident.
        </p>
      </main>
    </div>
  );
}
