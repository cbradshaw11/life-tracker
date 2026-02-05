import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { Entry, TrackType } from "../types";
import { getValueInputLabel } from "../utils/formatValue";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

interface EntryFormProps {
  date: Date;
  trackTypes: TrackType[];
  onSubmit: (entry: Omit<Entry, "id"> | Entry) => void;
  onClose: () => void;
  editingEntry?: Entry | null;
  addTrackType?: (trackType: TrackType) => void | Promise<TrackType | void>;
}

export function EntryForm({
  date,
  trackTypes,
  onSubmit,
  onClose,
  editingEntry,
  addTrackType,
}: EntryFormProps) {
  const [selectedTrackTypeId, setSelectedTrackTypeId] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [showCreateType, setShowCreateType] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValueType, setNewValueType] = useState<TrackType["valueType"]>("count");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newValueUnit, setNewValueUnit] = useState("");
  const [newDurationUnit, setNewDurationUnit] = useState<"minutes" | "hours">("minutes");

  useEffect(() => {
    if (editingEntry) {
      setSelectedTrackTypeId(editingEntry.trackTypeId);
      setValue(editingEntry.value?.toString() ?? "");
      setNote(editingEntry.note ?? "");
    } else if (trackTypes.length > 0 && !selectedTrackTypeId) {
      setSelectedTrackTypeId(trackTypes[0].id);
    }
  }, [editingEntry, trackTypes]);

  const selectedTrackType = trackTypes.find((t) => t.id === selectedTrackTypeId);
  const showValueInput =
    selectedTrackType &&
    (selectedTrackType.valueType === "count" ||
      selectedTrackType.valueType === "duration");

  const handleCreateType = async () => {
    if (!addTrackType || !newLabel.trim()) return;
    const slug = newLabel.toLowerCase().replace(/\s+/g, "-");
    if (trackTypes.some((t) => t.label.toLowerCase() === newLabel.trim().toLowerCase())) return;
    const trackType: TrackType = {
      id: slug,
      label: newLabel.trim(),
      color: newColor,
      valueType: newValueType,
    };
    if (newValueType === "count" && newValueUnit.trim()) {
      trackType.valueUnit = newValueUnit.trim();
    }
    if (newValueType === "duration") {
      trackType.durationUnit = newDurationUnit;
    }
    const created = await addTrackType(trackType);
    if (created) {
      setSelectedTrackTypeId(created.id);
    }
    setNewLabel("");
    setNewValueUnit("");
    setShowCreateType(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackTypeId) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const entry: Omit<Entry, "id"> = {
      date: dateStr,
      trackTypeId: selectedTrackTypeId,
      note: note.trim() || undefined,
    };

    if (showValueInput && value.trim()) {
      const num = parseFloat(value);
      if (!isNaN(num)) entry.value = num;
    }

    if (editingEntry) {
      onSubmit({ ...editingEntry, ...entry } as Entry);
    } else {
      onSubmit(entry);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingEntry ? "Edit Entry" : "Add Entry"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {format(date, "EEEE, MMMM d, yyyy")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Activity
            </label>
            <select
              value={selectedTrackTypeId}
              onChange={(e) => setSelectedTrackTypeId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            >
              {trackTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {addTrackType && (
              <>
                {showCreateType ? (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/50">
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Label (e.g. Meditation)"
                      className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <select
                      value={newValueType}
                      onChange={(e) =>
                        setNewValueType(e.target.value as TrackType["valueType"])
                      }
                      className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="count">Count</option>
                      <option value="duration">Duration</option>
                      <option value="boolean">Yes/No</option>
                    </select>
                    {newValueType === "count" && (
                      <input
                        type="text"
                        value={newValueUnit}
                        onChange={(e) => setNewValueUnit(e.target.value)}
                        placeholder="Unit (e.g. cigarettes)"
                        className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    )}
                    {newValueType === "duration" && (
                      <select
                        value={newDurationUnit}
                        onChange={(e) =>
                          setNewDurationUnit(e.target.value as "minutes" | "hours")
                        }
                        className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    )}
                    <div className="mb-2 flex gap-1">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewColor(c)}
                          className={`h-6 w-6 rounded-full border-2 transition-all ${
                            newColor === c
                              ? "border-gray-900 ring-2 ring-offset-1 ring-gray-900 dark:border-white dark:ring-white"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                          aria-label={`Select color ${c}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateType(false)}
                        className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateType}
                        disabled={!newLabel.trim()}
                        className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCreateType(true)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    + Create new activity type
                  </button>
                )}
              </>
            )}
          </div>

          {showValueInput && selectedTrackType && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {getValueInputLabel(selectedTrackType)}
              </label>
              <input
                type="number"
                min="0"
                step={selectedTrackType.valueType === "duration" ? "1" : "1"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  selectedTrackType.valueType === "duration"
                    ? selectedTrackType.durationUnit === "hours"
                      ? "e.g. 1.5"
                      : "e.g. 45"
                    : "e.g. 3"
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {editingEntry ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
