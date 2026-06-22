import { useCallback, useState } from "react";
import type { GrammarMap } from "../types";

// 英文を編集すると別の解説として扱うため、phraseIdと英文の組み合わせをキーにする
function grammarKey(phraseId: number, enText: string): string {
  return `${phraseId}::${enText}`;
}

export function useGrammar() {
  const [grammar, setGrammar] = useState<GrammarMap>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const fetchGrammar = useCallback(
    async (phraseId: number, enText: string, force = false) => {
      const key = grammarKey(phraseId, enText);
      if (!force && grammar[key]) return grammar[key];
      setLoadingId(phraseId);
      try {
        const res = await fetch("/api/grammar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phraseId, enText, force }),
        });
        const data = await res.json();
        setGrammar((prev) => ({ ...prev, [key]: data.grammar }));
        return data.grammar as string;
      } finally {
        setLoadingId(null);
      }
    },
    [grammar],
  );

  return { grammar, loadingId, fetchGrammar };
}
