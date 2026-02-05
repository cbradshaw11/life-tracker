import type { TrackType } from "../types";

interface TrackTypeBadgeProps {
  trackType: TrackType;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function TrackTypeBadge({
  trackType,
  size = "md",
  showLabel = false,
}: TrackTypeBadgeProps) {
  const dotSize = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full"
      style={{ color: trackType.color }}
    >
      <span
        className={`${dotSize} rounded-full flex-shrink-0`}
        style={{ backgroundColor: trackType.color }}
      />
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {trackType.label}
        </span>
      )}
    </span>
  );
}
