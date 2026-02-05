import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
} from "date-fns";
import { AddTrackTypeModal } from "./AddTrackTypeModal";
import { DayCell } from "./DayCell";
import { DayDetailModal } from "./DayDetailModal";
import { EntryForm } from "./EntryForm";
import type { Entry, TrackType } from "../types";

interface CalendarViewProps {
  entries: Entry[];
  trackTypes: TrackType[];
  addEntry: (entry: Omit<Entry, "id">) => void | Promise<Entry | null>;
  updateEntry: (id: string, updates: Partial<Entry>) => void | Promise<Entry | null>;
  deleteEntry: (id: string) => void | Promise<boolean>;
  addTrackType: (trackType: TrackType) => void | Promise<TrackType | void>;
  initialDate?: Date;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({
  entries,
  trackTypes,
  addEntry,
  updateEntry,
  deleteEntry,
  addTrackType,
  initialDate,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(
    initialDate ? startOfMonth(initialDate) : startOfMonth(new Date())
  );
  const [showDayDetail, setShowDayDetail] = useState<Date | null>(null);
  const [formDate, setFormDate] = useState<Date | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [showAddTrackType, setShowAddTrackType] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const handleDayClick = (date: Date) => {
    setShowDayDetail(date);
    setEditingEntry(null);
  };

  const handleSubmit = (entry: Omit<Entry, "id"> | Entry) => {
    if ("id" in entry && entry.id) {
      updateEntry(entry.id, entry);
    } else {
      addEntry(entry as Omit<Entry, "id">);
      setShowDayDetail(null);
    }
    setFormDate(null);
    setEditingEntry(null);
  };

  const handleQuickAdd = () => {
    setFormDate(new Date());
    setShowDayDetail(null);
    setEditingEntry(null);
  };

  const handleAddEntryFromDayDetail = () => {
    if (showDayDetail) {
      setFormDate(showDayDetail);
      setEditingEntry(null);
    }
  };

  const handleEditEntryFromDayDetail = (entry: Entry) => {
    setFormDate(new Date(entry.date + "T12:00:00"));
    setEditingEntry(entry);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {format(currentMonth, "MMMM yyyy")}
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAddTrackType(true)}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Add activity type
          </button>
          <button
            type="button"
            onClick={handleQuickAdd}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Quick add (today)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
          >
            {d}
          </div>
        ))}
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            date={day}
            currentMonth={currentMonth}
            entries={entries}
            trackTypes={trackTypes}
            onClick={handleDayClick}
          />
        ))}
      </div>

      <div className="flex justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Previous month"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Next month"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
      </div>

      {formDate && (
        <EntryForm
          date={formDate}
          trackTypes={trackTypes}
          onSubmit={handleSubmit}
          onClose={() => {
            setFormDate(null);
            setEditingEntry(null);
          }}
          editingEntry={editingEntry}
          addTrackType={addTrackType}
        />
      )}

      {showDayDetail && !formDate && (
        <DayDetailModal
          date={showDayDetail}
          entries={entries}
          trackTypes={trackTypes}
          onDelete={deleteEntry}
          onEdit={handleEditEntryFromDayDetail}
          onAddEntry={handleAddEntryFromDayDetail}
          onClose={() => setShowDayDetail(null)}
        />
      )}

      {showAddTrackType && (
        <AddTrackTypeModal
          trackTypes={trackTypes}
          onAdd={addTrackType}
          onClose={() => setShowAddTrackType(false)}
        />
      )}
    </div>
  );
}
