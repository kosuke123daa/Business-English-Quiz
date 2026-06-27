import { useCallback, useState } from "react";
import type { DuplicateMatch, Phrase } from "@/types";

export function useDuplicateCheck() {
  const [checking, setChecking] = useState(false);

  const checkDuplicates = useCallback(
    async (existing: Phrase[], candidates: { en: string; ja: string }[]): Promise<DuplicateMatch[]> => {
      if (existing.length === 0 || candidates.length === 0) return [];
      setChecking(true);
      try {
        const res = await fetch("/api/check-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ existing, candidates }),
        });
        const data = await res.json();
        return data.duplicates ?? [];
      } finally {
        setChecking(false);
      }
    },
    []
  );

  return { checking, checkDuplicates };
}
