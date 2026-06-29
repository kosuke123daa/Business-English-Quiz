import { useCallback, useEffect, useState } from "react";
import type { Phrase } from "@/types";

export interface CategoryGroup {
  category: string;
  phraseIds: number[];
}

export function useCategories(setId: string) {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/categorize-phrases?setId=${setId}`)
      .then((r) => r.json())
      .then((data: CategoryGroup[]) => {
        if (active) setCategories(data);
      });
    return () => {
      active = false;
    };
  }, [setId]);

  const generateCategories = useCallback(
    async (phrases: Phrase[]) => {
      setGenerating(true);
      try {
        const res = await fetch(`/api/categorize-phrases?setId=${setId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrases }),
        });
        const data: CategoryGroup[] = await res.json();
        setCategories(data);
      } finally {
        setGenerating(false);
      }
    },
    [setId],
  );

  return { categories, generating, generateCategories };
}
