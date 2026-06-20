import { useCallback, useEffect, useState } from "react";
import type { CustomMap, Lang } from "../types";

export function useCustom(setId: string, lang: Lang) {
  const [custom, setCustom] = useState<CustomMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/custom?setId=${setId}&lang=${lang}`)
      .then((r) => r.json())
      .then((data: CustomMap) => {
        if (active) setCustom(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setId, lang]);

  const setValue = useCallback(
    async (phraseId: number, value: string | null) => {
      setCustom((prev) => {
        const next = { ...prev };
        if (value === null) delete next[phraseId];
        else next[phraseId] = value;
        return next;
      });
      await fetch(`/api/custom?setId=${setId}&lang=${lang}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phraseId, value }),
      });
    },
    [setId, lang],
  );

  return { custom, loading, setValue };
}
