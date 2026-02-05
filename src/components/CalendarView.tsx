import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subMonths,
} from "date-fns";
import { AddTrackTypeModal } from "./AddTrackTypeModal";
import { DayCell } from "./DayCell";
import { DayDetailModal } from "./DayDetailModal";
import { EntryForm } from "./EntryForm";
import type { Entry, TrackType } from "../types";

const MONTHS_PER_PAGE = 12;
const MAX_YEARS_BACK = 100;

interface CalendarViewProps {
  entries: Entry[];
  trackTypes: TrackType[];
  addEntry: (entry: Omit<Entry, "id">) => void | Promise<Entry | null>;
  updateEntry: (id: string, updates: Partial<Entry>) => void | Promise<Entry | null>;
  deleteEntry: (id: string) => void | Promise<boolean>;
  addTrackType: (trackType: TrackType) => void | Promise<TrackType | void>;
  initialDate?: Date;
  scrollToMonth?: Date | null;
  onScrolledToTarget?: () => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function MonthGrid({
  monthStart,
  entries,
  trackTypes,
  onDayClick,
  onEntryClick,
}: {
  monthStart: Date;
  entries: Entry[];
  trackTypes: TrackType[];
  onDayClick: (date: Date) => void;
  onEntryClick?: (date: Date, entry: Entry) => void;
}) {
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map((d) => (
        <div
          key={d}
          className="py-2 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
        >
          {d}
        </div>
      ))}
      {days.map((d) => (
        <DayCell
          key={d.toISOString()}
          date={d}
          currentMonth={monthStart}
          entries={entries}
          trackTypes={trackTypes}
          onClick={onDayClick}
          onEntryClick={onEntryClick}
        />
      ))}
    </div>
  );
}

export function CalendarView({
  entries,
  trackTypes,
  addEntry,
  updateEntry,
  deleteEntry,
  addTrackType,
  initialDate,
  scrollToMonth,
  onScrolledToTarget,
}: CalendarViewProps) {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);

  const earliestEntryDate =
    entries.length > 0
      ? entries.reduce((min, e) => (e.date < min ? e.date : min), entries[0].date)
      : format(currentMonthStart, "yyyy-MM");
  const [earliestYear, earliestMonth] = earliestEntryDate.split("-").map(Number);
  const earliestMonthStart = new Date(earliestYear, earliestMonth - 1, 1);
  let initialTimelineStart = subMonths(earliestMonthStart, MONTHS_PER_PAGE);
  if (initialDate) {
    const targetStart = startOfMonth(initialDate);
    if (targetStart < initialTimelineStart) {
      initialTimelineStart = subMonths(targetStart, MONTHS_PER_PAGE);
    }
  }

  const [timelineStart, setTimelineStart] = useState(initialTimelineStart);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPreserveRef = useRef<{ height: number; top: number } | null>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const hasScrolledToTodayRef = useRef(false);
  const cameFromMonthClickRef = useRef(!!scrollToMonth);
  if (scrollToMonth) cameFromMonthClickRef.current = true;
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [visibleMonth, setVisibleMonth] = useState<Date>(currentMonthStart);

  const [showDayDetail, setShowDayDetail] = useState<Date | null>(null);
  const [formDate, setFormDate] = useState<Date | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [showAddTrackType, setShowAddTrackType] = useState(false);

  useEffect(() => {
    setTimelineStart(initialTimelineStart);
  }, [initialTimelineStart.getTime()]);

  const months: Date[] = [];
  let year = timelineStart.getFullYear();
  let month = timelineStart.getMonth();
  while (
    year < currentMonthStart.getFullYear() ||
    (year === currentMonthStart.getFullYear() &&
      month <= currentMonthStart.getMonth())
  ) {
    months.push(new Date(year, month, 1));
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  const canLoadMore =
    timelineStart > subMonths(currentMonthStart, MAX_YEARS_BACK * 12);

  const loadMoreOlder = useCallback(() => {
    if (!canLoadMore || isLoadingOlder || !scrollRef.current) return;
    setIsLoadingOlder(true);
    scrollPreserveRef.current = {
      height: scrollRef.current.scrollHeight,
      top: scrollRef.current.scrollTop,
    };
    setTimelineStart((prev) => subMonths(prev, MONTHS_PER_PAGE));
  }, [canLoadMore, isLoadingOlder]);

  useLayoutEffect(() => {
    if (!scrollToMonth) return;
    const key = format(startOfMonth(scrollToMonth), "yyyy-MM");
    const STICKY_HEADER_HEIGHT = 48;
    const scrollToEl = () => {
      const scrollEl = scrollRef.current;
      const monthEl = monthRefs.current[key];
      if (scrollEl && monthEl) {
        const containerRect = scrollEl.getBoundingClientRect();
        const monthRect = monthEl.getBoundingClientRect();
        const targetScrollTop =
          scrollEl.scrollTop + (monthRect.top - containerRect.top) - STICKY_HEADER_HEIGHT;
        scrollEl.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "auto" });
        const clearTarget = () => onScrolledToTarget?.();
        if ("onscrollend" in scrollEl) {
          (scrollEl as HTMLElement).addEventListener("scrollend", clearTarget, { once: true });
        } else {
          setTimeout(clearTarget, 100);
        }
        return true;
      }
      return false;
    };
    if (!scrollToEl()) {
      const id = requestAnimationFrame(() => {
        if (!scrollToEl()) requestAnimationFrame(scrollToEl);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [scrollToMonth, months.length, onScrolledToTarget]);

  useEffect(() => {
    if (cameFromMonthClickRef.current || scrollToMonth || hasScrolledToTodayRef.current) return;
    const scrollEl = scrollRef.current;
    if (!scrollEl || months.length === 0) return;
    hasScrolledToTodayRef.current = true;
    const todayCell = scrollEl.querySelector<HTMLElement>('[data-today="true"]');
    if (todayCell) {
      todayCell.scrollIntoView({ block: "end", behavior: "auto" });
    } else {
      scrollEl.scrollTo(0, scrollEl.scrollHeight);
    }
  }, [months.length, scrollToMonth]);

  useEffect(() => {
    if (!scrollPreserveRef.current || !scrollRef.current) return;
    const { height, top } = scrollPreserveRef.current;
    scrollPreserveRef.current = null;
    const newHeight = scrollRef.current.scrollHeight;
    scrollRef.current.scrollTop = top + (newHeight - height);
    setIsLoadingOlder(false);
  }, [months.length]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const scrollEl = scrollRef.current;
    if (!sentinel || !scrollEl || !canLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreOlder();
      },
      { root: scrollEl, rootMargin: "100px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canLoadMore, loadMoreOlder]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || months.length === 0) return;
    const TRIGGER_OFFSET = 80;
    const checkVisibleMonth = () => {
      const scrollTop = scrollEl.scrollTop;
      const point = scrollTop + TRIGGER_OFFSET;
      const containerRect = scrollEl.getBoundingClientRect();
      let found: Date | null = null;
      for (const monthStart of months) {
        const key = format(monthStart, "yyyy-MM");
        const el = monthRefs.current[key];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const top = rect.top - containerRect.top + scrollTop;
        const bottom = top + rect.height;
        if (point >= top && point < bottom) {
          found = monthStart;
          break;
        }
        if (top <= point) found = monthStart;
      }
      if (found) setVisibleMonth(found);
    };
    const rafRef = { id: 0 };
    const handleScroll = () => {
      if (rafRef.id) cancelAnimationFrame(rafRef.id);
      rafRef.id = requestAnimationFrame(() => {
        checkVisibleMonth();
        rafRef.id = 0;
      });
    };
    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    checkVisibleMonth();
    return () => {
      scrollEl.removeEventListener("scroll", handleScroll);
      if (rafRef.id) cancelAnimationFrame(rafRef.id);
    };
  }, [months]);

  const scrollToCurrent = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const todayCell = scrollEl.querySelector<HTMLElement>('[data-today="true"]');
    if (todayCell) {
      todayCell.scrollIntoView({ block: "end", behavior: "smooth" });
    } else {
      scrollEl.scrollTo(0, scrollEl.scrollHeight);
    }
  }, []);

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

  const handleEntryClickFromPopup = (date: Date, entry: Entry) => {
    setShowDayDetail(date);
    setFormDate(new Date(entry.date + "T12:00:00"));
    setEditingEntry(entry);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Calendar
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAddTrackType(true)}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Add entry type
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

      <div
        ref={scrollRef}
        className="max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-visible"
      >
        <div
          ref={topSentinelRef}
          className="h-1 shrink-0"
          aria-hidden="true"
        />
        {isLoadingOlder && canLoadMore && (
          <div className="flex justify-center py-3 text-sm text-gray-500 dark:text-gray-400">
            Loading older months…
          </div>
        )}
        <div className="relative pb-32">
          <div
            className="sticky top-0 z-10 flex items-center border-b border-gray-200 bg-gray-50 px-1 py-1.5 dark:border-gray-700 dark:bg-gray-900"
            aria-live="polite"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
              {format(visibleMonth, "MMMM yyyy")}
            </span>
          </div>
          {months.map((monthStart) => (
            <div
              key={format(monthStart, "yyyy-MM")}
              data-month={format(monthStart, "yyyy-MM")}
              ref={(el) => {
                const key = format(monthStart, "yyyy-MM");
                monthRefs.current[key] = el;
              }}
            >
              <MonthGrid
                monthStart={monthStart}
                entries={entries}
                trackTypes={trackTypes}
                onDayClick={handleDayClick}
                onEntryClick={handleEntryClickFromPopup}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={loadMoreOlder}
          disabled={!canLoadMore || isLoadingOlder}
          className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Previous month"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={scrollToCurrent}
          className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Scroll to current month"
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
            setShowDayDetail(null);
            setEditingEntry(null);
          }}
          onCancel={() => {
            setFormDate(null);
            setEditingEntry(null);
          }}
          onDelete={deleteEntry}
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
