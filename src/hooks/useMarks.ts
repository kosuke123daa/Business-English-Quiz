import { useCallback, useEffect, useState } from "react";
import type { Mark, MarksMap } from "../types";

export function useMarks(setId: string) {
  const [marks, setMarks] = useState<MarksMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/marks?setId=${setId}`)
      .then((r) => r.json())
      .then((data: MarksMap) => {
        if (active) setMarks(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setId]);

  const setMark = useCallback(
    async (phraseId: number, mark: Mark | null) => {
      setMarks((prev) => {
        const next = { ...prev };
        if (mark === null) delete next[phraseId];
        else next[phraseId] = mark;
        return next;
      });
      await fetch(`/api/marks?setId=${setId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phraseId, mark }),
      });
    },
    [setId],
  );

  const replaceAll = useCallback(
    async (newMarks: MarksMap) => {
      setMarks(newMarks);
      await fetch(`/api/marks?setId=${setId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMarks),
      });
    },
    [setId],
  );

  return { marks, loading, setMark, replaceAll };
}
