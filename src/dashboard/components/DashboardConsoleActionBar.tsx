// Inert stand-in for the previous designer's AI "Console action bar".
// The real, experimental implementation lives in src/experimental/ai/.
// The dashboard list-view engine imports this symbol; keeping it as a no-op
// means the AI surface is parked (not wired) without breaking the build.
export function DashboardConsoleActionBar() {
  return null;
}

export default DashboardConsoleActionBar;
