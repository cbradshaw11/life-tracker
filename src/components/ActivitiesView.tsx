import { subMonths, subYears } from "date-fns";
import { Link } from "react-router-dom";
import type { Entry, TrackType } from "../types";
import { TrackTypeBadge } from "./TrackTypeBadge";

interface ActivitiesViewProps {
  trackTypes: TrackType[];
  entries: Entry[];
}

export function ActivitiesView({ trackTypes, entries }: ActivitiesViewProps) {
  const today = new Date();
  const monthAgo = subMonths(today, 1);
  const yearAgo = subYears(today, 1);

  const monthAgoStr = monthAgo.toISOString().slice(0, 10);
  const yearAgoStr = yearAgo.toISOString().slice(0, 10);

  const entriesPastMonth = entries.filter((e) => e.date >= monthAgoStr);
  const entriesPastYear = entries.filter((e) => e.date >= yearAgoStr);

  const countByType = (
    entryList: Entry[]
  ): Record<string, number> =>
    trackTypes.reduce(
      (acc, tt) => {
        acc[tt.id] = entryList.filter((e) => e.trackTypeId === tt.id).length;
        return acc;
      },
      {} as Record<string, number>
    );

  const countPastMonth = countByType(entriesPastMonth);
  const countPastYear = countByType(entriesPastYear);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Activities
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Your tracked activity types and their usage
        </p>
      </div>

      {trackTypes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            No activities yet. Create one from the calendar or settings.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              to="/"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go to Calendar
            </Link>
            <Link
              to="/settings"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Settings
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {trackTypes.map((trackType) => {
            const monthCount = countPastMonth[trackType.id] ?? 0;
            const yearCount = countPastYear[trackType.id] ?? 0;
            return (
              <div
                key={trackType.id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex flex-col gap-1">
                  <TrackTypeBadge trackType={trackType} showLabel size="md" />
                  <div className="flex gap-4 text-sm font-normal text-gray-600 dark:text-gray-400">
                    <span>
                      {monthCount} {monthCount === 1 ? "entry" : "entries"} past month
                    </span>
                    <span>
                      {yearCount} {yearCount === 1 ? "entry" : "entries"} past year
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-4">
        <Link
          to="/settings"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Manage activities in Settings →
        </Link>
      </div>
    </div>
  );
}
