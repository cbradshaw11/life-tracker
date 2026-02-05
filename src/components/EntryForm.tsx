import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { Entry, TrackType } from "../types";

const METADATA_KEY_LABELS: Record<string, string> = {
  unit: "Unit",
  category: "Category",
  daily_goal: "Daily goal",
  intensity: "Intensity",
  location: "Location",
};

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
  onCancel?: () => void;
  onDelete?: (id: string) => void | Promise<boolean>;
  editingEntry?: Entry | null;
  addTrackType?: (trackType: TrackType) => void | Promise<TrackType | void>;
}

export function EntryForm({
  date,
  trackTypes,
  onSubmit,
  onClose,
  onCancel,
  onDelete,
  editingEntry,
  addTrackType,
}: EntryFormProps) {
  const [selectedTrackTypeId, setSelectedTrackTypeId] = useState<string>("");
  const [showCreateType, setShowCreateType] = useState(trackTypes.length === 0);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newValueUnit, setNewValueUnit] = useState("");
  const [showUnitInput, setShowUnitInput] = useState(false);
  const [entryMetadata, setEntryMetadata] = useState<Record<string, string>>({});

  const selectedTrackType = trackTypes.find((t) => t.id === selectedTrackTypeId);
  const metadataKeys = selectedTrackType?.metadata
    ? Object.keys(selectedTrackType.metadata).filter((k) => k !== "__other__")
    : [];

  useEffect(() => {
    if (editingEntry) {
      setSelectedTrackTypeId(editingEntry.trackTypeId);
      setEntryMetadata(editingEntry.metadata ?? {});
    } else if (trackTypes.length > 0 && !selectedTrackTypeId) {
      setSelectedTrackTypeId(trackTypes[0].id);
      setEntryMetadata({});
    }
  }, [editingEntry, trackTypes]);

  useEffect(() => {
    if (editingEntry && editingEntry.trackTypeId === selectedTrackTypeId) {
      setEntryMetadata(editingEntry.metadata ?? {});
    } else if (selectedTrackTypeId) {
      setEntryMetadata({});
    }
  }, [selectedTrackTypeId, editingEntry]);

  const handleCreateType = async () => {
    if (!addTrackType || !newLabel.trim()) return;
    const slug = newLabel.toLowerCase().replace(/\s+/g, "-");
    if (trackTypes.some((t) => t.label.toLowerCase() === newLabel.trim().toLowerCase())) return;
    const trackType: TrackType = {
      id: slug,
      label: newLabel.trim(),
      color: newColor,
      valueType: "count",
    };
    if (newValueUnit.trim()) {
      trackType.valueUnit = newValueUnit.trim();
    }
    const created = await addTrackType(trackType);
    if (created) {
      setSelectedTrackTypeId(created.id);
      setShowCreateType(false);
      setShowUnitInput(false);
    }
    setNewLabel("");
    setNewValueUnit("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackTypeId) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const entry: Omit<Entry, "id"> = {
      date: dateStr,
      trackTypeId: selectedTrackTypeId,
    };

    const meta = Object.fromEntries(
      Object.entries(entryMetadata).filter(([, v]) => v.trim())
    );
    if (Object.keys(meta).length > 0) {
      entry.metadata = meta;
    }

    if (editingEntry) {
      onSubmit({ ...editingEntry, ...entry } as Entry);
    } else {
      onSubmit(entry);
    }
    onClose();
  };

  if (showCreateType && addTrackType) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create Entry Type
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowCreateType(false);
                setShowUnitInput(false);
                if (trackTypes.length === 0) onClose();
              }}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Label
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Meditation"
                className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <div className="mb-3 flex gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${
                      newColor === c
                        ? "border-gray-900 ring-1 ring-offset-0 ring-gray-900 dark:border-white dark:ring-white"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
              {showUnitInput ? (
                <input
                  type="text"
                  value={newValueUnit}
                  onChange={(e) => setNewValueUnit(e.target.value)}
                  placeholder="Unit (e.g. cigarettes, glasses)"
                  className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUnitInput(true)}
                  className="mb-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  + Add optional unit
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateType(false);
                  setShowUnitInput(false);
                  if (trackTypes.length === 0) onClose();
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {trackTypes.length > 0 ? "Back" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleCreateType}
                disabled={!newLabel.trim()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {trackTypes.length > 0 && (
              <>
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
            {metadataKeys.length > 0 && (
              <div className="mt-3 space-y-2">
                {metadataKeys.map((key) => (
                  <div key={key}>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {METADATA_KEY_LABELS[key] ?? key.replace(/_/g, " ")}
                    </label>
                    <input
                      type="text"
                      value={entryMetadata[key] ?? ""}
                      onChange={(e) =>
                        setEntryMetadata((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder={selectedTrackType?.metadata?.[key] ?? ""}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            )}
            {trackTypes.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400">
                {addTrackType
                  ? "Create your first entry type to add entries."
                  : "No entry types yet."}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel ?? onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedTrackTypeId}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingEntry ? "Save" : "Add"}
              </button>
            </div>
            {editingEntry && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  await onDelete(editingEntry.id);
                  onClose();
                }}
                className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
