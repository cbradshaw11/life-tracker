import { useAuth } from "../contexts/AuthContext";

export function Profile() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Profile
      </h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Email
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">
              {user.email}
            </p>
          </div>
          {user.user_metadata?.full_name && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Name
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {user.user_metadata.full_name}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Account
        </h2>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
