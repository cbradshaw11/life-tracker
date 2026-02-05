import { format } from "date-fns";
import type { Entry, TrackType } from "../types";
import { formatEntryValue } from "../utils/formatValue";
import { TrackTypeBadge } from "./TrackTypeBadge";

interface DayDetailModalProps {
  date: Date;
  entries: Entry[];
  trackTypes: TrackType[];
  onDelete: (id: string) => void;
  onEdit: (entry: Entry) => void;
  onAddEntry: () => void;
  onClose: () => void;
}

export function DayDetailModal({
  date,
  entries,
  trackTypes,
  onDelete,
  onEdit,
  onAddEntry,
  onClose,
}: DayDetailModalProps) {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayEntries = entries.filter((e) => e.date === dateStr);

  const getTrackType = (id: string) => trackTypes.find((t) => t.id === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(date, "EEEE, MMMM d, yyyy")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {dayEntries.length === 0 ? (
          <p className="mb-4 text-gray-500 dark:text-gray-400">
            No entries for this day.
          </p>
        ) : (
          <ul className="mb-4 space-y-2">
            {dayEntries.map((entry) => {
              const trackType = getTrackType(entry.trackTypeId);
              if (!trackType) return null;
              const valueLabel = formatEntryValue(entry, trackType);
              return (
                <li
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onEdit(entry)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onEdit(entry);
                    }
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                  aria-label={`Edit ${trackType.label} entry`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <TrackTypeBadge trackType={trackType} showLabel />
                    <div className="min-w-0 flex-1">
                      {valueLabel && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {valueLabel}
                        </span>
                      )}
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {Object.entries(entry.metadata).map(([k, v]) =>
                            v ? (
                              <span key={k}>
                                {k.replace(/_/g, " ")}: {v}
                              </span>
                            ) : null
                          )}
                        </div>
                      )}
                      {entry.note && (
                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(entry.id);
                    }}
                    className="ml-2 rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label={`Delete ${trackType.label} entry`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onAddEntry}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add entry
          </button>
        </div>
      </div>
    </div>
  );
}
