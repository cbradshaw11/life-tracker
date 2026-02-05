import type { Entry, TrackType } from "../types";

export function getValueInputLabel(trackType: TrackType): string {
  if (trackType.valueType === "duration") {
    const unit = trackType.durationUnit === "hours" ? "hours" : "minutes";
    return `Duration (${unit})`;
  }
  if (trackType.valueType === "count") {
    return trackType.valueUnit
      ? `Count (${trackType.valueUnit})`
      : "Count";
  }
  return "Value";
}

export function formatEntryValue(entry: Entry, trackType: TrackType): string | null {
  if (entry.value == null) return null;
  if (trackType.valueType === "duration") {
    const unit = trackType.durationUnit === "hours" ? "hr" : "min";
    return `${entry.value} ${unit}`;
  }
  if (trackType.valueType === "count" && trackType.valueUnit) {
    return `${entry.value} ${trackType.valueUnit}`;
  }
  return `${entry.value}`;
}
