import { useState, useEffect, useCallback } from "react";
import type { Entry } from "../types";
import * as storage from "../store/storage";
import { useAuth } from "../contexts/AuthContext";

export function useEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setEntries([]);
      return;
    }
    try {
      const data = await storage.getEntries(user.id);
      setEntries(data);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const addEntry = useCallback(
    async (entry: Omit<Entry, "id">) => {
      if (!user?.id) return null;
      const newEntry = await storage.addEntry(user.id, entry);
      await refresh();
      return newEntry;
    },
    [user?.id, refresh]
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<Entry>) => {
      if (!user?.id) return null;
      const updated = await storage.updateEntry(user.id, id, updates);
      await refresh();
      return updated;
    },
    [user?.id, refresh]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!user?.id) return false;
      const ok = await storage.deleteEntry(user.id, id);
      await refresh();
      return ok;
    },
    [user?.id, refresh]
  );

  const getEntriesForDate = useCallback(
    (dateStr: string) => entries.filter((e) => e.date === dateStr),
    [entries]
  );

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesForDate,
    refresh,
  };
}
