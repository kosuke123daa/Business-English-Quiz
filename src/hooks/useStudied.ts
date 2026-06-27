import { useCallback, useEffect, useState } from "react";

export type StudiedMap = Record<number, string>;

export function useStudied(setId: string) {
  const [studied, setStudied] = useState<StudiedMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/studied?setId=${setId}`)
      .then((r) => r.json())
      .then((data: StudiedMap) => {
        if (active) setStudied(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setId]);

  const recordStudied = useCallback(
    async (groupNo: number) => {
      const date = new Date().toISOString().slice(0, 10);
      setStudied((prev) => ({ ...prev, [groupNo]: date }));
      await fetch(`/api/studied?setId=${setId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupNo, date }),
      });
    },
    [setId],
  );

  return { studied, loading, recordStudied };
}
