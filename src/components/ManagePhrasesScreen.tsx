import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Phrase, PhraseSet } from "@/types";

interface ManagePhrasesScreenProps {
  set: PhraseSet;
  onAddPhrase: (en: string, ja: string) => void;
  onDeletePhrase: (phraseId: number) => void;
  onBack: () => void;
}

export function ManagePhrasesScreen({ set, onAddPhrase, onDeletePhrase, onBack }: ManagePhrasesScreenProps) {
  const [en, setEn] = useState("");
  const [ja, setJa] = useState("");

  function handleAdd() {
    if (en.trim() === "" || ja.trim() === "") return;
    onAddPhrase(en.trim(), ja.trim());
    setEn("");
    setJa("");
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
          <p className="text-sm text-gray-600 mb-1">新しいフレーズを追加</p>
          <Textarea placeholder="英語フレーズ" value={en} onChange={(e) => setEn(e.target.value)} />
          <Textarea placeholder="日本語フレーズ" value={ja} onChange={(e) => setJa(e.target.value)} />
          <Button size="sm" onClick={handleAdd} disabled={en.trim() === "" || ja.trim() === ""}>
            + 追加
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
