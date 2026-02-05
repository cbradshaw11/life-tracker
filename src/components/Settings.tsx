import { useState } from "react";
import { subMonths, subYears } from "date-fns";
import { Link } from "react-router-dom";
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
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newValueUnit, setNewValueUnit] = useState("");
  const [showUnitInput, setShowUnitInput] = useState(false);

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
    if (newValueUnit.trim()) {
      trackType.valueUnit = newValueUnit.trim();
    }
    await addTrackType(trackType);
    onTrackTypesChange();
    setNewLabel("");
    setNewValueUnit("");
    setShowUnitInput(false);
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
    setNewValueUnit(tt.valueUnit ?? "");
    setShowUnitInput(!!tt.valueUnit);
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const updates: Partial<TrackType> = {
      label: newLabel.trim(),
      color: newColor,
      valueType: "count",
      valueUnit: newValueUnit.trim() || undefined,
      durationUnit: undefined,
    };
    await updateTrackType(editingId, updates);
    onTrackTypesChange();
    setEditingId(null);
    setNewLabel("");
    setNewValueUnit("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewLabel("");
    setNewColor("#3b82f6");
    setNewValueUnit("");
    setShowUnitInput(false);
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
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label (e.g. Meditation)"
                    className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
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
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Meditation)"
              className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setShowUnitInput(false);
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
