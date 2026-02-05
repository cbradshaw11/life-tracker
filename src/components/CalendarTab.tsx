import { useState } from "react";
import { CalendarView } from "./CalendarView";
import { YearView } from "./YearView";
import type { Entry, TrackType } from "../types";

interface CalendarTabProps {
  entries: Entry[];
  trackTypes: TrackType[];
  addEntry: (entry: Omit<Entry, "id">) => void | Promise<Entry | null>;
  updateEntry: (id: string, updates: Partial<Entry>) => void | Promise<Entry | null>;
  deleteEntry: (id: string) => void | Promise<boolean>;
  addTrackType: (trackType: TrackType) => void | Promise<TrackType | void>;
  initialDate?: Date;
}

type ViewMode = "calendar" | "year";

export function CalendarTab({
  entries,
  trackTypes,
  addEntry,
  updateEntry,
  deleteEntry,
  addTrackType,
  initialDate,
}: CalendarTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [scrollToMonth, setScrollToMonth] = useState<Date | null>(null);

  const handleMonthClickFromYear = (monthDate: Date) => {
    setScrollToMonth(monthDate);
    setViewMode("calendar");
  };

  return (
    <div className="relative">
      {viewMode === "calendar" ? (
        <CalendarView
          entries={entries}
          trackTypes={trackTypes}
          addEntry={addEntry}
          updateEntry={updateEntry}
          deleteEntry={deleteEntry}
          addTrackType={addTrackType}
          initialDate={scrollToMonth ?? initialDate}
          scrollToMonth={scrollToMonth}
          onScrolledToTarget={() => setScrollToMonth(null)}
        />
      ) : (
        <YearView
          entries={entries}
          trackTypes={trackTypes}
          onMonthClick={handleMonthClickFromYear}
        />
      )}

      <div className="fixed bottom-6 right-6 z-30 flex rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setViewMode("year")}
          className={`flex items-center gap-2 rounded-l-lg px-3 py-2 transition-colors ${
            viewMode === "year"
              ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
          }`}
          aria-label="Year overview"
          title="Year overview"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="text-sm font-medium">Year</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("calendar")}
          className={`flex items-center gap-2 rounded-r-lg border-l border-gray-200 px-3 py-2 transition-colors dark:border-gray-600 ${
            viewMode === "calendar"
              ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
          }`}
          aria-label="Calendar"
          title="Calendar"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-sm font-medium">Calendar</span>
        </button>
      </div>
    </div>
  );
}
