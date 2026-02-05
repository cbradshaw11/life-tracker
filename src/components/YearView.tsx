import { useState, useRef, useCallback, useEffect } from "react";
import { format, startOfMonth, isSameMonth, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { Entry, TrackType } from "../types";
import { MiniCalendar } from "./MiniCalendar";

const MONTHS_PER_PAGE = 12;
const MAX_YEARS_BACK = 100;

interface YearViewProps {
  entries: Entry[];
  trackTypes: TrackType[];
  onMonthClick?: (monthDate: Date) => void;
}

export function YearView({ entries, trackTypes, onMonthClick }: YearViewProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentMonthStart = startOfMonth(now);

  const earliestEntryDate = entries.length > 0
    ? entries.reduce((min, e) => (e.date < min ? e.date : min), entries[0].date)
    : format(currentMonthStart, "yyyy-MM");
  const [earliestYear, earliestMonth] = earliestEntryDate.split("-").map(Number);
  const earliestMonthStart = new Date(earliestYear, earliestMonth - 1, 1);
  const initialTimelineStart = subMonths(earliestMonthStart, MONTHS_PER_PAGE);

  const [timelineStart, setTimelineStart] = useState(initialTimelineStart);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const scrollPreserveRef = useRef<{ height: number; top: number } | null>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimelineStart(initialTimelineStart);
  }, [initialTimelineStart.getTime()]);

  const months: Array<{
    monthDate: Date;
    monthStr: string;
    activityByTrackType: Record<string, number>;
    activityDatesByTrackType: Record<string, string[]>;
  }> = [];
  let year = timelineStart.getFullYear();
  let month = timelineStart.getMonth();
  while (year < currentMonthStart.getFullYear() || (year === currentMonthStart.getFullYear() && month <= currentMonthStart.getMonth())) {
    const monthDate = new Date(year, month, 1);
    const monthStr = format(monthDate, "yyyy-MM");
    const monthEntries = entries.filter((e) => e.date.startsWith(monthStr));
    const activityByTrackType: Record<string, number> = {};
    const activityDatesByTrackType: Record<string, string[]> = {};
    trackTypes.forEach((t) => {
      const typeEntries = monthEntries.filter((e) => e.trackTypeId === t.id);
      activityByTrackType[t.id] = typeEntries.length;
      activityDatesByTrackType[t.id] = [
        ...new Set(typeEntries.map((e) => e.date)),
      ].sort();
    });
    months.push({
      monthDate,
      monthStr,
      activityByTrackType,
      activityDatesByTrackType,
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  const canLoadMore = timelineStart > subMonths(currentMonthStart, MAX_YEARS_BACK * 12);

  const loadMoreOlder = useCallback(() => {
    if (!canLoadMore || isLoadingOlder || !scrollRef.current) return;
    setIsLoadingOlder(true);
    scrollPreserveRef.current = {
      height: scrollRef.current.scrollHeight,
      top: scrollRef.current.scrollTop,
    };
    setTimelineStart((prev) => subMonths(prev, MONTHS_PER_PAGE));
  }, [canLoadMore, isLoadingOlder]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, []);

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

  const handleMonthClick = (monthDate: Date) => {
    if (onMonthClick) {
      onMonthClick(monthDate);
    } else {
      navigate(
        `/?year=${monthDate.getFullYear()}&month=${monthDate.getMonth() + 1}`
      );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Timeline
      </h1>

      <div
        ref={scrollRef}
        className="max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-visible"
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
        <div className="grid grid-cols-2 gap-4 overflow-visible pb-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: (4 - (months.length % 4)) % 4 }).map((_, i) => (
            <div key={`spacer-${i}`} aria-hidden="true" />
          ))}
          {months.map((m, i) => (
            <button
              key={m.monthStr}
              type="button"
              onClick={() => handleMonthClick(m.monthDate)}
            className="flex min-h-[140px] flex-col overflow-visible rounded-xl border border-gray-200 p-4 text-left transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {format(m.monthDate, "MMMM yyyy")}
              </span>
              {isSameMonth(m.monthDate, now) && (
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  Current
                </span>
              )}
            </div>
            <div className="mt-2 flex justify-center">
              <MiniCalendar
                monthDate={m.monthDate}
                highlightedDates={new Set(
                  Object.values(m.activityDatesByTrackType).flat()
                )}
                highlightColor="#3b82f6"
                compact
              />
            </div>
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
