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
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export function MiniCalendar({
  monthDate,
  highlightedDates,
  highlightColor,
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

  return (
    <div className="min-w-[224px] w-[224px]">
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="flex h-6 w-6 items-center justify-center text-[9px] font-medium text-gray-400"
          >
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
              className={`flex h-6 w-6 min-w-6 items-center justify-center rounded text-[10px] ${
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
