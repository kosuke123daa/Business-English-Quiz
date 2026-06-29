import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { phrasesToCsv } from "@/utils/csv";
import type { StudiedMap } from "@/hooks/useStudied";
import type { CategoryGroup } from "@/hooks/useCategories";
import type { Mark, MarksMap, PhraseSet } from "@/types";

const GROUP_SIZE = 10;

const MARK_OPTIONS: { mark: Mark; label: string }[] = [
  { mark: "o", label: "✅ 正解" },
  { mark: "?", label: "🤔 怪しい" },
  { mark: "x", label: "❌ 不正解" },
];

interface GroupsScreenProps {
  set: PhraseSet;
  marks: MarksMap;
  studied: StudiedMap;
  isCustom: boolean;
  categories: CategoryGroup[];
  categorizing: boolean;
  onGenerateCategories: () => void;
  onSelectGroup: (groupNo: number) => void;
  onSelectGroupFiltered: (groupNo: number, marksFilter: Mark[]) => void;
  onSelectSetFiltered: (marksFilter: Mark[]) => void;
  onSelectCategory: (phraseIds: number[]) => void;
  onManagePhrases: () => void;
  onShowList: () => void;
  onShowDedupe: () => void;
  onBack: () => void;
}

export function GroupsScreen({
  set,
  marks,
  studied,
  isCustom,
  categories,
  categorizing,
  onGenerateCategories,
  onSelectGroup,
  onSelectGroupFiltered,
  onSelectSetFiltered,
  onSelectCategory,
  onManagePhrases,
  onShowList,
  onShowDedupe,
  onBack,
}: GroupsScreenProps) {
  const groupCount = Math.ceil(set.data.length / GROUP_SIZE);
  const [selectedMarks, setSelectedMarks] = useState<Set<Mark>>(new Set());

  function toggleSelectedMark(mark: Mark) {
    setSelectedMarks((prev) => {
      const next = new Set(prev);
      if (next.has(mark)) next.delete(mark);
      else next.add(mark);
      return next;
    });
  }

  const selectedCount = set.data.filter((p) => selectedMarks.has(marks[p.id] as Mark)).length;

  function handleExportCsv() {
    const csv = phrasesToCsv(set.data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${set.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← セット選択へ
        </Button>
        <h1 className="text-xl font-bold">{set.name}</h1>
      </div>

      {isCustom && (
        <Button variant="outline" onClick={onManagePhrases}>
          ✏️ フレーズを管理（追加・削除）
        </Button>
      )}

      <Button variant="outline" disabled={set.data.length === 0} onClick={handleExportCsv}>
        📤 CSVエクスポート
      </Button>

      <Button variant="outline" disabled={set.data.length === 0} onClick={onShowList}>
        📋 フレーズ一覧を表示
      </Button>

      <Button variant="outline" disabled={set.data.length < 2} onClick={onShowDedupe}>
        🔍 重複チェック・削除
      </Button>

      {set.data.length === 0 && (
        <p className="text-sm text-gray-500">
          フレーズがまだ登録されていません。「✏️ フレーズを管理」から追加してください。
        </p>
      )}

      <Tabs defaultValue="groups">
        <TabsList>
          <TabsTrigger value="groups">通常グループ（G1〜G{groupCount}）</TabsTrigger>
          <TabsTrigger value="theme">テーマ別グループ</TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <Card>
            <CardContent className="pt-4 flex flex-col gap-2">
              <p className="text-sm text-gray-600">まとめて勉強（セット全体から条件で絞り込み）</p>
              <div className="flex gap-2">
                {MARK_OPTIONS.map(({ mark, label }) => (
                  <Button
                    key={mark}
                    size="sm"
                    variant={selectedMarks.has(mark) ? "default" : "outline"}
                    onClick={() => toggleSelectedMark(mark)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button disabled={selectedMarks.size === 0 || selectedCount === 0} onClick={() => onSelectSetFiltered([...selectedMarks])}>
                選択した条件で学習する（{selectedCount}問）
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {Array.from({ length: groupCount }, (_, i) => i + 1).map((groupNo) => {
              const start = (groupNo - 1) * GROUP_SIZE;
              const phrases = set.data.slice(start, start + GROUP_SIZE);
              const correct = phrases.filter((p) => marks[p.id] === "o").length;
              const wrong = phrases.filter((p) => marks[p.id] === "x").length;
              const uncertain = phrases.filter((p) => marks[p.id] === "?").length;
              const remaining = phrases.length - correct - wrong - uncertain;
              const progress = phrases.length === 0 ? 0 : ((correct + wrong + uncertain) / phrases.length) * 100;

              return (
                <Card
                  key={groupNo}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSelectGroup(groupNo)}
                >
                  <CardHeader>
                    <CardTitle>G{groupNo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>✅{correct}</span>
                      <span>🤔{uncertain}</span>
                      <span>❌{wrong}</span>
                      <span>残{remaining}</span>
                    </div>
                    <Progress value={progress} />
                    <p className="text-xs text-gray-500 mt-2">
                      最終学習日: {studied[groupNo] ?? "未学習"}
                    </p>
                    <div className="flex flex-col gap-1 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={correct === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGroupFiltered(groupNo, ["o"]);
                        }}
                      >
                        ✅ 正解だけ（{correct}）
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uncertain === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGroupFiltered(groupNo, ["?"]);
                        }}
                      >
                        🤔 怪しいだけ（{uncertain}）
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={wrong === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGroupFiltered(groupNo, ["x"]);
                        }}
                      >
                        ❌ 不正解だけ（{wrong}）
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardContent className="pt-4 flex flex-col gap-2">
              <p className="text-sm text-gray-600">意味が似ているフレーズをAIでまとめて学習</p>
              <Button
                variant="outline"
                disabled={set.data.length === 0 || categorizing}
                onClick={onGenerateCategories}
              >
                {categorizing ? "生成中..." : categories.length > 0 ? "🔄 再生成" : "🤖 似ている意味でグループ生成"}
              </Button>
              {categories.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {categories.map((cat) => {
                    const phraseIds = cat.phraseIds.filter((id) => set.data.some((p) => p.id === id));
                    return (
                      <Card
                        key={cat.category}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onSelectCategory(phraseIds)}
                      >
                        <CardHeader>
                          <CardTitle className="text-sm">{cat.category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-gray-500">{phraseIds.length}問</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
