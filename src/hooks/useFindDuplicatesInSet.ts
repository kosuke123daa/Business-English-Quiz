import { useCallback, useState } from "react";
import type { Phrase } from "@/types";

export interface DuplicateGroup {
  ids: number[];
  reason: string;
}

export function useFindDuplicatesInSet() {
  const [checking, setChecking] = useState(false);

  const findDuplicates = useCallback(async (phrases: Phrase[]): Promise<DuplicateGroup[]> => {
    if (phrases.length < 2) return [];
    setChecking(true);
    try {
      const res = await fetch("/api/find-duplicates-in-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrases }),
      });
      const data = await res.json();
      return data.groups ?? [];
    } finally {
      setChecking(false);
    }
  }, []);

  return { checking, findDuplicates };
}
