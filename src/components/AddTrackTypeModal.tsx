import { useState } from "react";
import type { TrackType } from "../types";

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

interface AddTrackTypeModalProps {
  trackTypes: TrackType[];
  onAdd: (trackType: TrackType) => void;
  onClose: () => void;
}

export function AddTrackTypeModal({
  trackTypes,
  onAdd,
  onClose,
}: AddTrackTypeModalProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newValueType, setNewValueType] = useState<TrackType["valueType"]>("count");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newValueUnit, setNewValueUnit] = useState("");
  const [newDurationUnit, setNewDurationUnit] = useState<"minutes" | "hours">("minutes");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = newLabel.toLowerCase().replace(/\s+/g, "-");
    if (!id || trackTypes.some((t) => t.id === id)) return;
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
    onAdd(trackType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create activity type
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Label
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Meditation, Sleep"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Value type
            </label>
            <select
              value={newValueType}
              onChange={(e) =>
                setNewValueType(e.target.value as TrackType["valueType"])
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="count">Count</option>
              <option value="duration">Duration</option>
              <option value="boolean">Yes/No</option>
            </select>
          </div>

          {newValueType === "count" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Unit (optional)
              </label>
              <input
                type="text"
                value={newValueUnit}
                onChange={(e) => setNewValueUnit(e.target.value)}
                placeholder="e.g. cigarettes, glasses, reps"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {newValueType === "duration" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration unit
              </label>
              <select
                value={newDurationUnit}
                onChange={(e) =>
                  setNewDurationUnit(e.target.value as "minutes" | "hours")
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <div className="flex gap-2">
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
              disabled={!newLabel.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
