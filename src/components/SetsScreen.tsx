import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { MarksMap, PhraseSet } from "@/types";

interface SetsScreenProps {
  sets: PhraseSet[];
  gpSets: PhraseSet[];
  marksBySet: Record<string, MarksMap>;
  customSetIds: string[];
  onSelect: (setId: string) => void;
  onUploadCsv: (file: File) => void;
  onCreateEmptySet: (name: string) => void;
  onRenameSet: (setId: string, newName: string) => void;
  onDeleteSet: (setId: string) => void;
  activeTab: "sets" | "grammar";
  onTabChange: (tab: "sets" | "grammar") => void;
  onCreateGrammarPractice: () => void;
  onRegenerateGrammarSet: (setId: string, setName: string) => void;
}

export function SetsScreen({
  sets,
  gpSets,
  marksBySet,
  customSetIds,
  onSelect,
  onUploadCsv,
  onCreateEmptySet,
  onRenameSet,
  onDeleteSet,
  activeTab,
  onTabChange,
  onCreateGrammarPractice,
  onRegenerateGrammarSet,
}: SetsScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function renderSetCard(set: PhraseSet) {
    const marks = marksBySet[set.id] ?? {};
    const total = set.data.length;
    const done = Object.values(marks).filter((m) => m !== "skip").length;
    const correct = Object.values(marks).filter((m) => m === "o").length;
    const progress = total === 0 ? 0 : (done / total) * 100;
    const isCustom = customSetIds.includes(set.id);
    return (
      <Card
        key={set.id}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onSelect(set.id)}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle style={{ color: set.color }}>{set.name}</CardTitle>
          {isCustom && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const name = window.prompt("新しい名前を入力してください", set.name);
                  if (name && name.trim() !== "") onRenameSet(set.id, name.trim());
                }}
              >
                ✏️
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm(`「${set.name}」を削除しますか？この操作は取り消せません。`)) {
                    onDeleteSet(set.id);
                  }
                }}
              >
                🗑️
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{done}/{total} 問対応済み</span>
            <span>✅ {correct}</span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">ビジネス英語クイズ</h1>

      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "sets" | "grammar")}>
        <TabsList>
          <TabsTrigger value="sets">📚 フレーズ集</TabsTrigger>
          <TabsTrigger value="grammar">✏️ 文法練習</TabsTrigger>
        </TabsList>

        <TabsContent value="sets" className="flex flex-col gap-4 mt-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600 mb-3">
                CSVファイルをアップロードして新しいフレーズ集を追加できます。
                形式は「連番, 英語, 日本語」の3列です。
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  📥 CSVをアップロード
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = window.prompt("新しいフレーズ集の名前を入力してください");
                    if (name && name.trim() !== "") onCreateEmptySet(name.trim());
                  }}
                >
                  ＋ 空のフレーズ集を作成
                </Button>
              </div>
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

          {sets.map(renderSetCard)}
        </TabsContent>

        <TabsContent value="grammar" className="flex flex-col gap-4 mt-4">
          <Card>
            <CardContent className="pt-4 flex flex-col gap-2">
              <p className="text-sm text-gray-600">
                練習したい文法テーマを入力すると、ビジネス会話の練習問題を10問生成します。
                作った問題集は繰り返し練習できます。
              </p>
              <Button onClick={onCreateGrammarPractice}>
                🤖 新規文法問題集を作成
              </Button>
            </CardContent>
          </Card>

          {gpSets.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              まだ文法問題集がありません。上のボタンから作成してください。
            </p>
          )}

          {gpSets.map((set) => {
            const marks = marksBySet[set.id] ?? {};
            const total = set.data.length;
            const done = Object.values(marks).filter((m) => m !== "skip").length;
            const correct = Object.values(marks).filter((m) => m === "o").length;
            const progress = total === 0 ? 0 : (done / total) * 100;
            return (
              <Card key={set.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelect(set.id)}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle style={{ color: set.color }}>{set.name}</CardTitle>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => onRegenerateGrammarSet(set.id, set.name)}>
                      🔄 再作成
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      const name = window.prompt("新しい名前を入力してください", set.name);
                      if (name && name.trim() !== "") onRenameSet(set.id, name.trim());
                    }}>✏️</Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (window.confirm(`「${set.name}」を削除しますか？`)) onDeleteSet(set.id);
                    }}>🗑️</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{done}/{total} 問対応済み</span>
                    <span>✅ {correct}</span>
                  </div>
                  <Progress value={progress} />
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
