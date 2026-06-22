import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { MarksMap, PhraseSet } from "@/types";

const GROUP_SIZE = 20;

interface GroupsScreenProps {
  set: PhraseSet;
  marks: MarksMap;
  onSelectGroup: (groupNo: number) => void;
  onSelectGroupWrongMode: (groupNo: number) => void;
  onSelectWrongMode: () => void;
  onBack: () => void;
}

export function GroupsScreen({
  set,
  marks,
  onSelectGroup,
  onSelectGroupWrongMode,
  onSelectWrongMode,
  onBack,
}: GroupsScreenProps) {
  const groupCount = Math.ceil(set.data.length / GROUP_SIZE);
  const totalWrong = Object.values(marks).filter((m) => m === "x").length;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← セット選択へ
        </Button>
        <h1 className="text-xl font-bold">{set.name}</h1>
      </div>

      <Button variant="destructive" disabled={totalWrong === 0} onClick={onSelectWrongMode}>
        ❌ 不正解まとめモード（{totalWrong}問）
      </Button>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: groupCount }, (_, i) => i + 1).map((groupNo) => {
          const start = (groupNo - 1) * GROUP_SIZE;
          const phrases = set.data.slice(start, start + GROUP_SIZE);
          const correct = phrases.filter((p) => marks[p.id] === "o").length;
          const wrong = phrases.filter((p) => marks[p.id] === "x").length;
          const remaining = phrases.length - correct - wrong;
          const progress = phrases.length === 0 ? 0 : ((correct + wrong) / phrases.length) * 100;

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
                  <span>❌{wrong}</span>
                  <span>残{remaining}</span>
                </div>
                <Progress value={progress} />
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2 w-full"
                  disabled={wrong === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectGroupWrongMode(groupNo);
                  }}
                >
                  ❌ 不正解だけ（{wrong}）
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
