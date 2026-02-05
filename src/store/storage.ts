import type { Entry, TrackType } from "../types";
import { supabase } from "../lib/supabase";

function mapDbTrackType(row: {
  id: string;
  label: string;
  color: string;
  value_type: string;
  value_unit: string | null;
  duration_unit: string | null;
  metadata?: Record<string, string> | null;
}): TrackType {
  const tt: TrackType = {
    id: row.id,
    label: row.label,
    color: row.color,
    valueType: row.value_type as TrackType["valueType"],
    valueUnit: row.value_unit ?? undefined,
    durationUnit: (row.duration_unit as TrackType["durationUnit"]) ?? undefined,
  };
  if (row.metadata && typeof row.metadata === "object" && Object.keys(row.metadata).length > 0) {
    tt.metadata = row.metadata as Record<string, string>;
  }
  return tt;
}

function mapDbEntry(row: {
  id: string;
  date: string;
  track_type_id: string;
  value: number | null;
  note: string | null;
  metadata?: Record<string, string> | null;
}): Entry {
  const entry: Entry = {
    id: row.id,
    date: row.date,
    trackTypeId: row.track_type_id,
    value: row.value ?? undefined,
    note: row.note ?? undefined,
  };
  if (row.metadata && typeof row.metadata === "object" && Object.keys(row.metadata).length > 0) {
    entry.metadata = row.metadata as Record<string, string>;
  }
  return entry;
}

export async function getEntries(userId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("id, date, track_type_id, value, note, metadata")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (error) {
    if (error.message?.includes("metadata") || error.code === "PGRST204") {
      const { data: fallback, error: err2 } = await supabase
        .from("entries")
        .select("id, date, track_type_id, value, note")
        .eq("user_id", userId)
        .order("date", { ascending: true });
      if (err2) throw err2;
      return (fallback ?? []).map(mapDbEntry);
    }
    throw error;
  }
  return (data ?? []).map(mapDbEntry);
}

export async function addEntry(userId: string, entry: Omit<Entry, "id">): Promise<Entry> {
  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    date: entry.date,
    track_type_id: entry.trackTypeId,
    value: entry.value ?? null,
    note: entry.note ?? null,
  };
  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    insertPayload.metadata = entry.metadata;
  }
  const { data, error } = await supabase
    .from("entries")
    .insert(insertPayload)
    .select("id, date, track_type_id, value, note, metadata")
    .single();
  if (error) {
    if (insertPayload.metadata) {
      const colError = error.message?.includes("metadata") || error.message?.includes("column");
      if (colError) {
        delete insertPayload.metadata;
        const { data: fallback, error: err2 } = await supabase
          .from("entries")
          .insert(insertPayload)
          .select("id, date, track_type_id, value, note")
          .single();
        if (!err2) {
          const result = mapDbEntry(fallback);
          result.metadata = entry.metadata;
          return result;
        }
      }
    }
    throw error;
  }
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
  if (updates.metadata != null && Object.keys(updates.metadata).length > 0) {
    payload.metadata = updates.metadata;
  }
  if (Object.keys(payload).length === 0) {
    const existing = await getEntries(userId);
    return existing.find((e) => e.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from("entries")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, date, track_type_id, value, note, metadata")
    .single();
  if (error) {
    if (payload.metadata && (error.message?.includes("metadata") || error.message?.includes("column"))) {
      delete payload.metadata;
      const { data: fallback, error: err2 } = await supabase
        .from("entries")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId)
        .select("id, date, track_type_id, value, note")
        .single();
      if (!err2 && fallback) {
        const result = mapDbEntry(fallback);
        if (updates.metadata) result.metadata = updates.metadata;
        return result;
      }
    }
    return null;
  }
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

const LEGACY_DEFAULT_LABELS = ["Smoking", "Workout", "Drinking"];

export async function getTrackTypes(userId: string): Promise<TrackType[]> {
  const { data, error } = await supabase
    .from("track_types")
    .select("id, label, color, value_type, value_unit, duration_unit, metadata")
    .eq("user_id", userId);
  if (error) throw error;
  const types = (data ?? []).map(mapDbTrackType);

  // One-time migration: remove legacy defaults if user has exactly those 3
  const labels = types.map((t) => t.label).sort();
  const legacyLabels = [...LEGACY_DEFAULT_LABELS].sort();
  if (
    types.length === 3 &&
    labels[0] === legacyLabels[0] &&
    labels[1] === legacyLabels[1] &&
    labels[2] === legacyLabels[2]
  ) {
    for (const t of types) {
      await supabase.from("track_types").delete().eq("id", t.id).eq("user_id", userId);
    }
    return [];
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
      metadata: trackType.metadata ?? null,
    })
    .select("id, label, color, value_type, value_unit, duration_unit, metadata")
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
  if (updates.metadata != null) payload.metadata = updates.metadata;
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
