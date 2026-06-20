import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { MarksMap, PhraseSet } from "@/types";

interface SetsScreenProps {
  sets: PhraseSet[];
  marksBySet: Record<string, MarksMap>;
  onSelect: (setId: string) => void;
  onUploadCsv: (file: File) => void;
}

export function SetsScreen({ sets, marksBySet, onSelect, onUploadCsv }: SetsScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">フレーズ集を選択</h1>

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600 mb-3">
            CSVファイルをアップロードすると、新しいフレーズ集を追加できます。
            <br />
            各行は「連番, 英語フレーズ, 日本語フレーズ」の3列で構成してください（1行目はヘッダーでもOK）。
            <br />
            アップロードしたCSVのファイル名（拡張子を除く）がそのままフレーズ集の名前になります。
          </p>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            📥 CSVをアップロードしてフレーズ集を追加
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadCsv(file);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      {sets.map((set) => {
        const marks = marksBySet[set.id] ?? {};
        const total = set.data.length;
        const done = Object.keys(marks).length;
        const correct = Object.values(marks).filter((m) => m === "o").length;
        const progress = total === 0 ? 0 : (done / total) * 100;
        return (
          <Card
            key={set.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelect(set.id)}
          >
            <CardHeader>
              <CardTitle style={{ color: set.color }}>{set.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  {done}/{total} 問対応済み
                </span>
                <span>✅ {correct}</span>
              </div>
              <Progress value={progress} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
