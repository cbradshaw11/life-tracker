import { useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { format, isSameMonth } from "date-fns";
import type { Entry, TrackType } from "../types";
import { TrackTypeBadge } from "./TrackTypeBadge";

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  entries: Entry[];
  trackTypes: TrackType[];
  onClick: (date: Date) => void;
  onEntryClick?: (date: Date, entry: Entry) => void;
}

const TOOLTIP_WIDTH = 240;
const TOOLTIP_OFFSET = 8;

export function DayCell({
  date,
  currentMonth,
  entries,
  trackTypes,
  onClick,
  onEntryClick,
}: DayCellProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; placement: "above" | "below" } | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateStr = format(date, "yyyy-MM-dd");
  const dayEntries = entries.filter((e) => e.date === dateStr);
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isToday =
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const getTrackType = (id: string) => trackTypes.find((t) => t.id === id);
  const displayEntries = dayEntries.slice(0, 5);
  const overflowCount = dayEntries.length - displayEntries.length;

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (dayEntries.length === 0) return;
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const estimatedTooltipHeight = Math.min(dayEntries.length * 48 + 60, 280);
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const placement =
        spaceBelow >= estimatedTooltipHeight || spaceBelow >= spaceAbove
          ? "below"
          : "above";

      const x = Math.max(
        TOOLTIP_WIDTH / 2,
        Math.min(rect.left + rect.width / 2, window.innerWidth - TOOLTIP_WIDTH / 2)
      );
      const y =
        placement === "below"
          ? rect.bottom + TOOLTIP_OFFSET
          : rect.top - TOOLTIP_OFFSET;

      setTooltip({ x, y, placement });
    },
    [dayEntries.length]
  );

  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => setTooltip(null), 100);
  }, []);

  const handleTooltipMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => onClick(date)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-today={isToday ? "true" : undefined}
        className={`min-h-[60px] w-full rounded-lg border p-1.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 sm:min-h-[80px] sm:p-2 ${
          isToday ? "scroll-mb-16" : ""
        } ${
          isCurrentMonth
            ? "border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            : "border-gray-100 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500"
        } ${isToday ? "ring-2 ring-blue-400 ring-offset-2" : ""}`}
      >
        <span className="block text-sm font-medium">{format(date, "d")}</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {displayEntries.map((entry) => {
            const trackType = getTrackType(entry.trackTypeId);
            if (!trackType) return null;
            return (
              <TrackTypeBadge key={entry.id} trackType={trackType} size="sm" />
            );
          })}
          {overflowCount > 0 && (
            <span className="text-xs text-gray-500">+{overflowCount}</span>
          )}
        </div>
      </button>

      {tooltip &&
        createPortal(
          <div
            className="fixed z-50 w-[240px] cursor-pointer rounded-lg border-2 border-gray-200 bg-white py-2 shadow-lg transition-colors hover:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: `translate(-50%, ${tooltip.placement === "below" ? "0" : "-100%"})`,
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            onClick={() => {
              setTooltip(null);
              onClick(date);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setTooltip(null);
                onClick(date);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`View entries for ${format(date, "EEEE, MMM d")}`}
          >
            <div className="mb-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              {format(date, "EEEE, MMM d")}
            </div>
            <ul className="max-h-[240px] overflow-y-auto">
              {dayEntries.map((entry) => {
                const trackType = getTrackType(entry.trackTypeId);
                if (!trackType) return null;
                return (
                  <li
                    key={entry.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTooltip(null);
                      onEntryClick?.(date, entry);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        setTooltip(null);
                        onEntryClick?.(date, entry);
                      }
                    }}
                    role={onEntryClick ? "button" : undefined}
                    tabIndex={onEntryClick ? 0 : undefined}
                    className={`flex flex-col gap-0.5 px-3 py-1.5 text-left ${
                      onEntryClick
                        ? "cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <TrackTypeBadge trackType={trackType} size="sm" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {trackType.label}
                      </span>
                    </div>
                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <div className="ml-3.5 flex flex-wrap gap-x-2 gap-y-0 text-xs text-gray-500 dark:text-gray-400">
                        {Object.entries(entry.metadata).map(
                          ([k, v]) =>
                            v && (
                              <span key={k}>
                                {k.replace(/_/g, " ")}: {v}
                              </span>
                            )
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}
