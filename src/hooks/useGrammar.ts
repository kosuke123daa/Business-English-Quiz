import { useCallback, useState } from "react";
import type { GrammarMap } from "../types";

export function useGrammar() {
  const [grammar, setGrammar] = useState<GrammarMap>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const fetchGrammar = useCallback(
    async (phraseId: number, enText: string) => {
      if (grammar[phraseId]) return grammar[phraseId];
      setLoadingId(phraseId);
      try {
        const res = await fetch("/api/grammar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phraseId, enText }),
        });
        const data = await res.json();
        setGrammar((prev) => ({ ...prev, [phraseId]: data.grammar }));
        return data.grammar as string;
      } finally {
        setLoadingId(null);
      }
    },
    [grammar],
  );

  return { grammar, loadingId, fetchGrammar };
}
