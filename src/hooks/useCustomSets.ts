import { useCallback, useEffect, useState } from "react";
import type { PhraseSet } from "../types";

export function useCustomSets() {
  const [customSets, setCustomSets] = useState<PhraseSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/sets")
      .then((r) => r.json())
      .then((data: PhraseSet[]) => {
        if (active) setCustomSets(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const addSet = useCallback(async (set: PhraseSet) => {
    setCustomSets((prev) => [...prev, set]);
    await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(set),
    });
  }, []);

  const renameSet = useCallback(async (id: string, name: string) => {
    setCustomSets((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    await fetch("/api/sets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
  }, []);

  const deleteSet = useCallback(async (id: string) => {
    setCustomSets((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/sets?id=${id}`, { method: "DELETE" });
  }, []);

  return { customSets, loading, addSet, renameSet, deleteSet };
}
