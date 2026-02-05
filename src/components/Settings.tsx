import { useState } from "react";
import type { Entry, TrackType } from "../types";
import { TrackTypeBadge } from "./TrackTypeBadge";

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
  const [newValueType, setNewValueType] = useState<TrackType["valueType"]>("count");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newValueUnit, setNewValueUnit] = useState("");
  const [newDurationUnit, setNewDurationUnit] = useState<"minutes" | "hours">("minutes");

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
      valueType: newValueType,
    };
    if (newValueType === "count" && newValueUnit.trim()) {
      trackType.valueUnit = newValueUnit.trim();
    }
    if (newValueType === "duration") {
      trackType.durationUnit = newDurationUnit;
    }
    await addTrackType(trackType);
    onTrackTypesChange();
    setNewLabel("");
    setNewValueUnit("");
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
    setNewValueType(tt.valueType);
    setNewColor(tt.color);
    setNewValueUnit(tt.valueUnit ?? "");
    setNewDurationUnit(tt.durationUnit ?? "minutes");
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const updates: Partial<TrackType> = {
      label: newLabel.trim(),
      color: newColor,
      valueType: newValueType,
    };
    if (newValueType === "count") {
      updates.valueUnit = newValueUnit.trim() || undefined;
      updates.durationUnit = undefined;
    } else if (newValueType === "duration") {
      updates.durationUnit = newDurationUnit;
      updates.valueUnit = undefined;
    } else {
      updates.valueUnit = undefined;
      updates.durationUnit = undefined;
    }
    await updateTrackType(editingId, updates);
    onTrackTypesChange();
    setEditingId(null);
    setNewLabel("");
    setNewValueUnit("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewLabel("");
    setNewValueType("count");
    setNewColor("#3b82f6");
    setNewValueUnit("");
    setNewDurationUnit("minutes");
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
          Track Types
        </h2>
        <div className="space-y-3">
          {trackTypes.map((tt) => (
            <div key={tt.id}>
              {editingId === tt.id ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label (e.g. Meditation)"
                    className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <select
                    value={newValueType}
                    onChange={(e) =>
                      setNewValueType(e.target.value as TrackType["valueType"])
                    }
                    className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                      placeholder="Unit (optional, e.g. cigarettes, glasses)"
                      className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  )}
                  {newValueType === "duration" && (
                    <select
                      value={newDurationUnit}
                      onChange={(e) =>
                        setNewDurationUnit(e.target.value as "minutes" | "hours")
                      }
                      className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                    </select>
                  )}
                  <div className="mb-3 flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          newColor === c
                            ? "border-gray-900 ring-4 ring-offset-2 ring-gray-900 dark:border-white dark:ring-white"
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
                  <TrackTypeBadge trackType={tt} showLabel />
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
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Meditation)"
              className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <select
              value={newValueType}
              onChange={(e) =>
                setNewValueType(e.target.value as TrackType["valueType"])
              }
              className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                placeholder="Unit (optional, e.g. cigarettes, glasses)"
                className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            )}
            {newValueType === "duration" && (
              <select
                value={newDurationUnit}
                onChange={(e) =>
                  setNewDurationUnit(e.target.value as "minutes" | "hours")
                }
                className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            )}
            <div className="mb-3 flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    newColor === c
                      ? "border-gray-900 ring-4 ring-offset-2 ring-gray-900 dark:border-white dark:ring-white"
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
                onClick={() => setShowAddForm(false)}
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
            Add track type
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
