import { useCallback, useEffect, useState } from "react";
import type { Phrase } from "@/types";

export function useBuiltinOverride(id: string, defaultData: Phrase[]) {
  const [data, setData] = useState<Phrase[]>(defaultData);

  useEffect(() => {
    let active = true;
    fetch(`/api/builtin-set?id=${id}`)
      .then((r) => r.json())
      .then((override: Phrase[] | null) => {
        if (active && override && override.length > 0) setData(override);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const updateData = useCallback(
    async (newData: Phrase[]) => {
      setData(newData);
      await fetch(`/api/builtin-set?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });
    },
    [id],
  );

  return { data, updateData };
}
