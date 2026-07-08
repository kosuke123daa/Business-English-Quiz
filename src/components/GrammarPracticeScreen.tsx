import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Phrase } from "@/types";

interface GeneratedPhrase {
  ja: string;
  en: string;
}

interface GrammarPracticeScreenProps {
  /** 再作成モード時に渡す既存セット情報 */
  editSetId?: string;
  editSetName?: string;
  /** trueのとき、editSetNameを説明文として即座に生成を開始する */
  autoGenerate?: boolean;
  onSave: (name: string, phrases: Phrase[]) => void;
  onUpdate?: (id: string, name: string, phrases: Phrase[]) => void;
  onBack: () => void;
}

export function GrammarPracticeScreen({ editSetId, editSetName, autoGenerate, onSave, onUpdate, onBack }: GrammarPracticeScreenProps) {
  const isEditMode = !!editSetId;
  const [description, setDescription] = useState("");
  const [generated, setGenerated] = useState<GeneratedPhrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setName, setSetName] = useState(editSetName ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (autoGenerate && editSetName) {
      generateWith(editSetName);
    }
  }, []);

  async function generateWith(text: string) {
    setLoading(true);
    setError(null);
    setGenerated([]);
    setSaved(false);
    try {
      const res = await fetch("/api/generate-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grammarDescription: text }),
      });
      const data = await res.json();
      if (!res.ok || !data.phrases) throw new Error(data.error ?? "生成に失敗しました");
      setGenerated(data.phrases);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!description.trim()) return;
    await generateWith(description.trim());
    if (!isEditMode) setSetName(description.trim().slice(0, 40));
  }

  function handleSave() {
    if (generated.length === 0 || !setName.trim()) return;
    const phrases: Phrase[] = generated.map((p, i) => ({ id: i + 1, en: p.en, ja: p.ja }));
    if (isEditMode && onUpdate) {
      onUpdate(editSetId!, setName.trim(), phrases);
    } else {
      onSave(setName.trim(), phrases);
    }
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← 戻る
        </Button>
        <h1 className="text-xl font-bold">
          {isEditMode ? "文法問題集を再作成" : "文法練習問題を作る"}
        </h1>
      </div>

      {isEditMode && (
        <p className="text-sm text-gray-500">
          「{editSetName}」の内容を新しく生成した問題で上書きします。
        </p>
      )}

      <p className="text-sm text-gray-600">
        練習したい文法・表現を入力すると、ビジネス英語の練習問題を10問生成します。
      </p>

      <Textarea
        placeholder="例：助動詞 can / will を使った依頼・提案表現"
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
                {isEditMode ? "🔄 上書き保存する" : "💾 セットとして保存する"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-green-600 font-medium">
                ✅ 「{setName}」を{isEditMode ? "更新" : "保存"}しました。
              </p>
              <Button variant="outline" onClick={() => generateWith(isEditMode ? (editSetName ?? description) : description)} disabled={loading}>
                🔄 同じテーマで再生成
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
