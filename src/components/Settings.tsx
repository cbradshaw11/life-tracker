import { useState } from "react";
import { subMonths, subYears } from "date-fns";
import { Link } from "react-router-dom";
import type { Entry, TrackType } from "../types";
import { TrackTypeBadge } from "./TrackTypeBadge";

const METADATA_KEY_OPTIONS = [
  { value: "unit", label: "Unit" },
  { value: "category", label: "Category" },
  { value: "daily_goal", label: "Daily goal" },
  { value: "intensity", label: "Intensity" },
  { value: "location", label: "Location" },
  { value: "__other__", label: "Other (custom)" },
] as const;

interface SettingsProps {
  trackTypes: TrackType[];
  entries: Entry[];
  onTrackTypesChange: () => void;
  addTrackType: (trackType: TrackType) => void | Promise<TrackType | void>;
  updateTrackType: (id: string, updates: Partial<TrackType>) => void | Promise<void>;
  deleteTrackType: (id: string) => void | Promise<void>;
}

export function Settings({
  trackTypes,
  entries,
  onTrackTypesChange,
  addTrackType,
  updateTrackType,
  deleteTrackType,
}: SettingsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [metadataEntries, setMetadataEntries] = useState<Array<{ id: string; key: string; value: string }>>([]);
  const [showMetadataInput, setShowMetadataInput] = useState(false);

  const today = new Date();
  const monthAgo = subMonths(today, 1);
  const yearAgo = subYears(today, 1);
  const monthAgoStr = monthAgo.toISOString().slice(0, 10);
  const yearAgoStr = yearAgo.toISOString().slice(0, 10);
  const entriesPastMonth = entries.filter((e) => e.date >= monthAgoStr);
  const entriesPastYear = entries.filter((e) => e.date >= yearAgoStr);
  const countByType = (entryList: Entry[]): Record<string, number> =>
    trackTypes.reduce(
      (acc, tt) => {
        acc[tt.id] = entryList.filter((e) => e.trackTypeId === tt.id).length;
        return acc;
      },
      {} as Record<string, number>
    );
  const countPastMonth = countByType(entriesPastMonth);
  const countPastYear = countByType(entriesPastYear);

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

  const handleAdd = async () => {
    const id = newLabel.toLowerCase().replace(/\s+/g, "-");
    if (!id || trackTypes.some((t) => t.label.toLowerCase() === newLabel.trim().toLowerCase())) return;
    const trackType: TrackType = {
      id,
      label: newLabel.trim(),
      color: newColor,
      valueType: "count",
    };
    const meta = metadataEntries
      .filter((e) => e.key.trim() && e.key !== "__other__")
      .reduce((acc, e) => ({ ...acc, [e.key.trim()]: e.value }), {} as Record<string, string>);
    if (Object.keys(meta).length > 0) {
      trackType.metadata = meta;
    }
    await addTrackType(trackType);
    onTrackTypesChange();
    setNewLabel("");
    setMetadataEntries([]);
    setShowMetadataInput(false);
    setShowAddForm(false);
  };

  const handleDelete = async (id: string) => {
    if (trackTypes.length <= 1) return;
    await deleteTrackType(id);
    onTrackTypesChange();
    if (editingId === id) setEditingId(null);
  };

  const handleEdit = (tt: TrackType) => {
    setEditingId(tt.id);
    setNewLabel(tt.label);
    setNewColor(tt.color);
    setMetadataEntries(
      tt.metadata
        ? Object.entries(tt.metadata).map(([key, value]) => ({
            id: `${key}-${Date.now()}`,
            key,
            value,
          }))
        : []
    );
    setShowMetadataInput(!!(tt.metadata && Object.keys(tt.metadata).length > 0));
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const updates: Partial<TrackType> = {
      label: newLabel.trim(),
      color: newColor,
      valueType: "count",
      durationUnit: undefined,
      metadata: metadataEntries
        .filter((e) => e.key.trim() && e.key !== "__other__")
        .reduce((acc, e) => ({ ...acc, [e.key.trim()]: e.value }), {} as Record<string, string>),
    };
    await updateTrackType(editingId, updates);
    onTrackTypesChange();
    setEditingId(null);
    setNewLabel("");
    setMetadataEntries([]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewLabel("");
    setNewColor("#3b82f6");
    setMetadataEntries([]);
    setShowMetadataInput(false);
  };

  const addMetadataField = () => {
    setMetadataEntries((prev) => [...prev, { id: `new-${Date.now()}`, key: "", value: "" }]);
    setShowMetadataInput(true);
  };
  const updateMetadataEntry = (id: string, key: string, value: string) => {
    setMetadataEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, key, value } : e))
    );
  };
  const removeMetadataEntry = (id: string) => {
    setMetadataEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleExport = () => {
    const data = {
      entries,
      trackTypes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `life-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Entry Types
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Your entry types and their usage
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
          Entry Types
        </h2>
        {trackTypes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              No entry types yet. Create one below or add your first entry from the calendar.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                to="/"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Go to Calendar
              </Link>
            </div>
          </div>
        ) : null}
        <div className="space-y-3">
          {trackTypes.map((tt) => (
            <div key={tt.id}>
              {editingId === tt.id ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
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
                  <div className="mb-3 flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          newColor === c
                            ? "border-gray-900 ring-1 ring-offset-0 ring-gray-900 dark:border-white dark:ring-white"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>
                  {showMetadataInput ? (
                    <div className="mb-3 space-y-2">
                      {metadataEntries.map((e) => {
                      const presetMatch = METADATA_KEY_OPTIONS.find((o) => o.value !== "__other__" && o.value === e.key);
                      const selectValue = presetMatch ? e.key : (e.key ? "__other__" : "");
                      const showCustomKeyInput = selectValue === "__other__";
                      return (
                        <div key={e.id} className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <select
                              value={selectValue}
                              onChange={(ev) => {
                                const v = ev.target.value;
                                updateMetadataEntry(e.id, v === "__other__" ? "__other__" : v, e.value);
                              }}
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Select key...</option>
                              {METADATA_KEY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {!showCustomKeyInput && (
                              <input
                                type="text"
                                value={e.value}
                                onChange={(ev) =>
                                  updateMetadataEntry(e.id, e.key, ev.target.value)
                                }
                                placeholder="Value"
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => removeMetadataEntry(e.id)}
                              className="rounded p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                              aria-label="Remove"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          {showCustomKeyInput && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={e.key === "__other__" ? "" : e.key}
                                onChange={(ev) =>
                                  updateMetadataEntry(e.id, ev.target.value || "__other__", e.value)
                                }
                                placeholder="Custom key"
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                              <input
                                type="text"
                                value={e.value}
                                onChange={(ev) =>
                                  updateMetadataEntry(e.id, e.key, ev.target.value)
                                }
                                placeholder="Value"
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                      <button
                        type="button"
                        onClick={addMetadataField}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        + Add another metadata field
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={addMetadataField}
                      className="mb-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      + Add optional metadata
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 dark:border-gray-600 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={!newLabel.trim()}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex flex-col gap-1">
                    <TrackTypeBadge trackType={tt} showLabel size="md" />
                    <div className="flex gap-4 text-sm font-normal text-gray-600 dark:text-gray-400">
                      <span>
                        {countPastMonth[tt.id] ?? 0} {(countPastMonth[tt.id] ?? 0) === 1 ? "entry" : "entries"} past month
                      </span>
                      <span>
                        {countPastYear[tt.id] ?? 0} {(countPastYear[tt.id] ?? 0) === 1 ? "entry" : "entries"} past year
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(tt)}
                      className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tt.id)}
                      disabled={trackTypes.length <= 1}
                      className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showAddForm && !editingId ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Create Entry Type
            </h3>
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
            <div className="mb-3 flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    newColor === c
                      ? "border-gray-900 ring-1 ring-offset-0 ring-gray-900 dark:border-white dark:ring-white"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
            {showMetadataInput ? (
              <div className="mb-3 space-y-2">
                {metadataEntries.map((e) => {
                  const presetMatch = METADATA_KEY_OPTIONS.find((o) => o.value !== "__other__" && o.value === e.key);
                  const selectValue = presetMatch ? e.key : (e.key ? "__other__" : "");
                  const showCustomKeyInput = selectValue === "__other__";
                  return (
                    <div key={e.id} className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <select
                          value={selectValue}
                          onChange={(ev) => {
                            const v = ev.target.value;
                            updateMetadataEntry(e.id, v === "__other__" ? "__other__" : v, e.value);
                          }}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select key...</option>
                          {METADATA_KEY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        {!showCustomKeyInput && (
                          <input
                            type="text"
                            value={e.value}
                            onChange={(ev) =>
                              updateMetadataEntry(e.id, e.key, ev.target.value)
                            }
                            placeholder="Value"
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMetadataEntry(e.id)}
                          className="rounded p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                          aria-label="Remove"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {showCustomKeyInput && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={e.key === "__other__" ? "" : e.key}
                            onChange={(ev) =>
                              updateMetadataEntry(e.id, ev.target.value || "__other__", e.value)
                            }
                            placeholder="Custom key"
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={e.value}
                            onChange={(ev) =>
                              updateMetadataEntry(e.id, e.key, ev.target.value)
                            }
                            placeholder="Value"
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addMetadataField}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  + Add another metadata field
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={addMetadataField}
                className="mb-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                + Add optional metadata
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setShowMetadataInput(false);
                  setMetadataEntries([]);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newLabel.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              cancelEdit();
              setShowAddForm(true);
            }}
            className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add entry type
          </button>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
          Data
        </h2>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Export data (JSON)
        </button>
      </section>
    </div>
  );
}
