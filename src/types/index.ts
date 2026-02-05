export interface TrackType {
  id: string;
  label: string;
  color: string;
  valueType: "count" | "duration" | "boolean";
  /** Custom unit for count (e.g. "cigarettes", "glasses"). Optional. */
  valueUnit?: string;
  /** Unit for duration. Defaults to "minutes" if not set. */
  durationUnit?: "minutes" | "hours";
}

export interface Entry {
  id: string;
  date: string;
  trackTypeId: string;
  value?: number;
  note?: string;
}
