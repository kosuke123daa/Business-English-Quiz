import { useCallback, useState } from "react";
import { resizeImageToBase64 } from "@/utils/image";

export function useExtractPhrases() {
  const [extracting, setExtracting] = useState(false);

  const extractFromImage = useCallback(async (file: File): Promise<{ en: string; ja: string }[]> => {
    setExtracting(true);
    try {
      const { base64, mediaType } = await resizeImageToBase64(file);
      const res = await fetch("/api/extract-phrases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const data = await res.json();
      return data.phrases ?? [];
    } finally {
      setExtracting(false);
    }
  }, []);

  return { extracting, extractFromImage };
}
