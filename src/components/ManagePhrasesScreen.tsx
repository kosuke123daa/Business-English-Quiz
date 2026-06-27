import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { parsePhraseCsv } from "@/utils/csv";
import type { DuplicateMatch, Phrase, PhraseSet } from "@/types";

interface ManagePhrasesScreenProps {
  set: PhraseSet;
  onAddPhrases: (newPhrases: { en: string; ja: string }[]) => void;
  onDeletePhrase: (phraseId: number) => void;
  onBack: () => void;
}

interface PendingImport {
  candidates: { en: string; ja: string }[];
  duplicates: DuplicateMatch[];
}

export function ManagePhrasesScreen({ set, onAddPhrases, onDeletePhrase, onBack }: ManagePhrasesScreenProps) {
  const [en, setEn] = useState("");
  const [ja, setJa] = useState("");
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [approvedDuplicates, setApprovedDuplicates] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checking, checkDuplicates } = useDuplicateCheck();

  async function startReview(candidates: { en: string; ja: string }[]) {
    const duplicates = await checkDuplicates(set.data, candidates);
    if (duplicates.length === 0) {
      onAddPhrases(candidates);
      return;
    }
    setPending({ candidates, duplicates });
    setApprovedDuplicates(new Set());
  }

  async function handleAdd() {
    if (en.trim() === "" || ja.trim() === "") return;
    await startReview([{ en: en.trim(), ja: ja.trim() }]);
    setEn("");
    setJa("");
  }

  async function handleUploadCsv(file: File) {
    const text = await file.text();
    const parsed = parsePhraseCsv(text);
    if (parsed.length === 0) {
      window.alert("CSVを読み取れませんでした。「連番,英語フレーズ,日本語フレーズ」の3列構成にしてください。");
      return;
    }
    await startReview(parsed.map((p) => ({ en: p.en, ja: p.ja })));
  }

  function toggleApproved(candidateIndex: number) {
    setApprovedDuplicates((prev) => {
      const next = new Set(prev);
      if (next.has(candidateIndex)) next.delete(candidateIndex);
      else next.add(candidateIndex);
      return next;
    });
  }

  function handleConfirmImport() {
    if (!pending) return;
    const duplicateIndices = new Set(pending.duplicates.map((d) => d.candidateIndex));
    const final = pending.candidates.filter(
      (_, i) => !duplicateIndices.has(i) || approvedDuplicates.has(i)
    );
    onAddPhrases(final);
    setPending(null);
    setApprovedDuplicates(new Set());
    setEn("");
    setJa("");
  }

  function handleCancelImport() {
    setPending(null);
    setApprovedDuplicates(new Set());
  }

  function findExisting(existingId: number): Phrase | undefined {
    return set.data.find((p) => p.id === existingId);
  }

  if (pending) {
    const duplicateIndices = new Set(pending.duplicates.map((d) => d.candidateIndex));
    const nonDuplicateCount = pending.candidates.length - duplicateIndices.size;

    return (
      <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleCancelImport}>
            ← キャンセル
          </Button>
          <h1 className="text-xl font-bold">重複チェック結果</h1>
        </div>

        {nonDuplicateCount > 0 && (
          <p className="text-sm text-gray-600">
            重複の疑いがないフレーズ {nonDuplicateCount}件は確定時にそのまま追加されます。
          </p>
        )}

        <div className="flex flex-col gap-2">
          {pending.duplicates.map((dup) => {
            const candidate = pending.candidates[dup.candidateIndex];
            const existingPhrase = findExisting(dup.existingId);
            const approved = approvedDuplicates.has(dup.candidateIndex);
            return (
              <Card key={dup.candidateIndex}>
                <CardContent className="pt-4 flex flex-col gap-2">
                  <div>
                    <p className="text-xs text-gray-500">追加候補</p>
                    <p>{candidate.en}</p>
                    <p className="text-sm text-gray-600">{candidate.ja}</p>
                  </div>
                  {existingPhrase && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-500">被っている既存フレーズ</p>
                      <p>{existingPhrase.en}</p>
                      <p className="text-sm text-gray-600">{existingPhrase.ja}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">{dup.reason}</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={approved} onChange={() => toggleApproved(dup.candidateIndex)} />
                    それでも追加する
                  </label>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleConfirmImport}>確定して追加</Button>
          <Button variant="outline" onClick={handleCancelImport}>
            キャンセル
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← グループ選択へ
        </Button>
        <h1 className="text-xl font-bold">{set.name} を編集</h1>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-col gap-2">
          <p className="text-sm text-gray-600 mb-1">CSVでまとめて追加</p>
          <p className="text-xs text-gray-500">
            「連番,英語フレーズ,日本語フレーズ」の3列構成のCSVをアップロードすると、既存フレーズとの重複をチェックしてからこのフレーズ集に追加されます。
          </p>
          <Button variant="outline" size="sm" disabled={checking} onClick={() => fileInputRef.current?.click()}>
            📥 CSVをアップロード
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadCsv(file);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 flex flex-col gap-2">
          <p className="text-sm text-gray-600 mb-1">新しいフレーズを追加</p>
          <Textarea placeholder="英語フレーズ" value={en} onChange={(e) => setEn(e.target.value)} />
          <Textarea placeholder="日本語フレーズ" value={ja} onChange={(e) => setJa(e.target.value)} />
          <Button size="sm" onClick={handleAdd} disabled={checking || en.trim() === "" || ja.trim() === ""}>
            {checking ? "重複チェック中..." : "+ 追加"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {set.data.length === 0 && <p className="text-sm text-gray-500">フレーズがまだ登録されていません。</p>}
        {set.data.map((phrase: Phrase) => (
          <Card key={phrase.id}>
            <CardContent className="pt-4 flex items-start justify-between gap-2">
              <div>
                <p>{phrase.en}</p>
                <p className="text-sm text-gray-600">{phrase.ja}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm("このフレーズを削除しますか？")) onDeletePhrase(phrase.id);
                }}
              >
                🗑️
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
