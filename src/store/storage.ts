import type { Entry, TrackType } from "../types";
import { supabase } from "../lib/supabase";

const DEFAULT_TRACK_TYPES: Omit<TrackType, "id">[] = [
  { label: "Smoking", color: "#ef4444", valueType: "count", valueUnit: "cigarettes" },
  { label: "Workout", color: "#22c55e", valueType: "duration", durationUnit: "minutes" },
  { label: "Drinking", color: "#3b82f6", valueType: "count", valueUnit: "drinks" },
];

function mapDbTrackType(row: {
  id: string;
  label: string;
  color: string;
  value_type: string;
  value_unit: string | null;
  duration_unit: string | null;
}): TrackType {
  return {
    id: row.id,
    label: row.label,
    color: row.color,
    valueType: row.value_type as TrackType["valueType"],
    valueUnit: row.value_unit ?? undefined,
    durationUnit: (row.duration_unit as TrackType["durationUnit"]) ?? undefined,
  };
}

function mapDbEntry(row: {
  id: string;
  date: string;
  track_type_id: string;
  value: number | null;
  note: string | null;
}): Entry {
  return {
    id: row.id,
    date: row.date,
    trackTypeId: row.track_type_id,
    value: row.value ?? undefined,
    note: row.note ?? undefined,
  };
}

async function seedDefaultTrackTypes(userId: string): Promise<TrackType[]> {
  const inserts = DEFAULT_TRACK_TYPES.map((tt) => ({
    user_id: userId,
    label: tt.label,
    color: tt.color,
    value_type: tt.valueType,
    value_unit: tt.valueUnit ?? null,
    duration_unit: tt.durationUnit ?? null,
  }));
  const { data, error } = await supabase
    .from("track_types")
    .insert(inserts)
    .select("id, label, color, value_type, value_unit, duration_unit");
  if (error) throw error;
  return (data ?? []).map(mapDbTrackType);
}

export async function getEntries(userId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("id, date, track_type_id, value, note")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapDbEntry);
}

export async function addEntry(userId: string, entry: Omit<Entry, "id">): Promise<Entry> {
  const { data, error } = await supabase
    .from("entries")
    .insert({
      user_id: userId,
      date: entry.date,
      track_type_id: entry.trackTypeId,
      value: entry.value ?? null,
      note: entry.note ?? null,
    })
    .select("id, date, track_type_id, value, note")
    .single();
  if (error) throw error;
  return mapDbEntry(data);
}

export async function updateEntry(
  userId: string,
  id: string,
  updates: Partial<Entry>
): Promise<Entry | null> {
  const payload: Record<string, unknown> = {};
  if (updates.date != null) payload.date = updates.date;
  if (updates.trackTypeId != null) payload.track_type_id = updates.trackTypeId;
  if (updates.value != null) payload.value = updates.value;
  if (updates.note != null) payload.note = updates.note;
  if (Object.keys(payload).length === 0) {
    const existing = await getEntries(userId);
    return existing.find((e) => e.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from("entries")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, date, track_type_id, value, note")
    .single();
  if (error) return null;
  return data ? mapDbEntry(data) : null;
}

export async function deleteEntry(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

export async function getTrackTypes(userId: string): Promise<TrackType[]> {
  const { data, error } = await supabase
    .from("track_types")
    .select("id, label, color, value_type, value_unit, duration_unit")
    .eq("user_id", userId);
  if (error) throw error;
  const types = (data ?? []).map(mapDbTrackType);
  if (types.length === 0) {
    return seedDefaultTrackTypes(userId);
  }
  return types;
}

export async function addTrackType(userId: string, trackType: TrackType): Promise<TrackType> {
  const { data, error } = await supabase
    .from("track_types")
    .insert({
      user_id: userId,
      label: trackType.label,
      color: trackType.color,
      value_type: trackType.valueType,
      value_unit: trackType.valueUnit ?? null,
      duration_unit: trackType.durationUnit ?? null,
    })
    .select("id, label, color, value_type, value_unit, duration_unit")
    .single();
  if (error) throw error;
  return mapDbTrackType(data);
}

export async function updateTrackType(
  userId: string,
  id: string,
  updates: Partial<TrackType>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.label != null) payload.label = updates.label;
  if (updates.color != null) payload.color = updates.color;
  if (updates.valueType != null) payload.value_type = updates.valueType;
  if (updates.valueUnit != null) payload.value_unit = updates.valueUnit;
  if (updates.durationUnit != null) payload.duration_unit = updates.durationUnit;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase
    .from("track_types")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteTrackType(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from("track_types")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
