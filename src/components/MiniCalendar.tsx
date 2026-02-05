import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
} from "date-fns";

interface MiniCalendarProps {
  monthDate: Date;
  highlightedDates: Set<string>;
  highlightColor: string;
  /** Compact mode for embedding in year view cards */
  compact?: boolean;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export function MiniCalendar({
  monthDate,
  highlightedDates,
  highlightColor,
  compact = false,
}: MiniCalendarProps) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const cellClass = compact
    ? "flex h-4 w-4 min-w-4 items-center justify-center rounded-sm text-[8px]"
    : "flex h-6 w-6 min-w-6 items-center justify-center rounded text-[10px]";
  const headerClass = compact
    ? "flex h-4 w-4 min-w-4 items-center justify-center text-[6px] font-medium text-gray-400"
    : "flex h-6 w-6 items-center justify-center text-[9px] font-medium text-gray-400";
  const containerClass = compact ? "w-[112px]" : "min-w-[224px] w-[224px]";
  const gapClass = compact ? "gap-0.5" : "gap-1";

  return (
    <div className={containerClass}>
      <div className={`grid grid-cols-7 ${gapClass}`}>
        {WEEKDAYS.map((d, i) => (
          <div key={i} className={headerClass}>
            {d}
          </div>
        ))}
        {days.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const isHighlighted = highlightedDates.has(dateStr);
          const isCurrentMonth = isSameMonth(d, monthDate);
          return (
            <div
              key={dateStr}
              className={`${cellClass} ${
                isCurrentMonth ? "text-gray-700 dark:text-gray-300" : "text-gray-300 dark:text-gray-600"
              } ${isHighlighted ? "font-semibold text-white" : ""}`}
              style={
                isHighlighted
                  ? { backgroundColor: highlightColor }
                  : undefined
              }
            >
              {format(d, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
