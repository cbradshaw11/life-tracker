import { useState, useEffect, useCallback } from "react";
import type { TrackType } from "../types";
import * as storage from "../store/storage";
import { useAuth } from "../contexts/AuthContext";

export function useTrackTypes() {
  const { user } = useAuth();
  const [trackTypes, setTrackTypesState] = useState<TrackType[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setTrackTypesState([]);
      return;
    }
    try {
      const data = await storage.getTrackTypes(user.id);
      setTrackTypesState(data);
    } catch (err) {
      console.error("Failed to fetch track types:", err);
      setTrackTypesState([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const addTrackType = useCallback(
    async (trackType: TrackType): Promise<TrackType | void> => {
      if (!user?.id) return;
      const created = await storage.addTrackType(user.id, trackType);
      setTrackTypesState((prev) => [...prev, created]);
      return created;
    },
    [user?.id]
  );

  const updateTrackType = useCallback(
    async (id: string, updates: Partial<TrackType>) => {
      if (!user?.id) return;
      await storage.updateTrackType(user.id, id, updates);
      await refresh();
    },
    [user?.id, refresh]
  );

  const deleteTrackType = useCallback(
    async (id: string) => {
      if (!user?.id) return;
      await storage.deleteTrackType(user.id, id);
      await refresh();
    },
    [user?.id, refresh]
  );

  const getTrackType = useCallback(
    (id: string) => trackTypes.find((t) => t.id === id),
    [trackTypes]
  );

  return {
    trackTypes,
    loading,
    addTrackType,
    updateTrackType,
    deleteTrackType,
    getTrackType,
    refresh,
  };
}
