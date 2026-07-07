import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Phrase } from "@/types";

interface GeneratedPhrase {
  ja: string;
  en: string;
}

interface GrammarPracticeScreenProps {
  onSave: (name: string, phrases: Phrase[]) => void;
  onBack: () => void;
}

export function GrammarPracticeScreen({ onSave, onBack }: GrammarPracticeScreenProps) {
  const [description, setDescription] = useState("");
  const [generated, setGenerated] = useState<GeneratedPhrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setName, setSetName] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleGenerate() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setGenerated([]);
    setSaved(false);
    try {
      const res = await fetch("/api/generate-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grammarDescription: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.phrases) throw new Error(data.error ?? "生成に失敗しました");
      setGenerated(data.phrases);
      setSetName(description.trim().slice(0, 40));
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (generated.length === 0 || !setName.trim()) return;
    const phrases: Phrase[] = generated.map((p, i) => ({ id: i + 1, en: p.en, ja: p.ja }));
    onSave(setName.trim(), phrases);
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← 戻る
        </Button>
        <h1 className="text-xl font-bold">文法練習問題を作る</h1>
      </div>

      <p className="text-sm text-gray-600">
        練習したい文法・表現を入力すると、ビジネス英語の練習問題を10問生成します。
      </p>

      <Textarea
        placeholder="例：助動詞 could / would を使った丁寧な依頼表現"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <Button onClick={handleGenerate} disabled={loading || !description.trim()}>
        {loading ? "生成中..." : "🤖 10問生成する"}
      </Button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {generated.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {generated.map((p, i) => (
              <Card key={i}>
                <CardContent className="pt-4 flex gap-3">
                  <span className="text-sm text-gray-400 w-6 shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-sm text-gray-600">{p.ja}</p>
                    <p className="text-sm mt-1">{p.en}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!saved ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">セット名</p>
              <input
                className="border rounded px-3 py-2 text-sm w-full"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
              />
              <Button onClick={handleSave} disabled={!setName.trim()}>
                💾 セットとして保存する
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-green-600 font-medium">✅ 「{setName}」として保存しました。メイン画面から練習できます。</p>
              <Button variant="outline" onClick={handleGenerate} disabled={loading}>
                🔄 同じテーマで再生成
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
