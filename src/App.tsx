import { useSearchParams, Link, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useEntries } from "./hooks/useEntries";
import { useTrackTypes } from "./hooks/useTrackTypes";
import { CalendarTab } from "./components/CalendarTab";
import { Profile } from "./components/Profile";
import { Settings } from "./components/Settings";
import { LoginPage } from "./components/LoginPage";

function App() {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { entries, addEntry, updateEntry, deleteEntry } = useEntries();
  const {
    trackTypes,
    addTrackType,
    updateTrackType,
    deleteTrackType,
    refresh: refreshTrackTypes,
  } = useTrackTypes();
  const [searchParams] = useSearchParams();
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const initialDate =
    yearParam && monthParam
      ? new Date(parseInt(yearParam), parseInt(monthParam) - 1, 1)
      : undefined;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-3">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Life Tracker
            </span>
          </div>
        </nav>
        <LoginPage onSignIn={signIn} onSignUp={signUp} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Life Tracker
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Calendar
            </Link>
            <Link
              to="/settings"
              className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Entry Types
            </Link>
            <Link
              to="/profile"
              className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <CalendarTab
                entries={entries}
                trackTypes={trackTypes}
                addEntry={addEntry}
                updateEntry={updateEntry}
                deleteEntry={deleteEntry}
                addTrackType={addTrackType}
                initialDate={initialDate}
              />
            }
          />
          <Route path="/year" element={<Navigate to="/" replace />} />
          <Route path="/activities" element={<Navigate to="/settings" replace />} />
          <Route
            path="/settings"
            element={
              <Settings
                trackTypes={trackTypes}
                entries={entries}
                onTrackTypesChange={refreshTrackTypes}
                addTrackType={addTrackType}
                updateTrackType={updateTrackType}
                deleteTrackType={deleteTrackType}
              />
            }
          />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
