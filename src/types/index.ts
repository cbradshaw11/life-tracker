export interface TrackType {
  id: string;
  label: string;
  color: string;
  valueType: "count" | "duration" | "boolean";
  /** Custom unit for count (e.g. "cigarettes", "glasses"). Optional. */
  valueUnit?: string;
  /** Unit for duration. Defaults to "minutes" if not set. */
  durationUnit?: "minutes" | "hours";
  /** Optional custom metadata key-value pairs. */
  metadata?: Record<string, string>;
}

export interface Entry {
  id: string;
  date: string;
  trackTypeId: string;
  value?: number;
  note?: string;
  /** Per-entry metadata values (keys come from the track type's metadata). */
  metadata?: Record<string, string>;
}
