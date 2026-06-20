import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MarksMap, PhraseSet } from "@/types";

interface SetsScreenProps {
  sets: PhraseSet[];
  marksBySet: Record<string, MarksMap>;
  onSelect: (setId: string) => void;
}

export function SetsScreen({ sets, marksBySet, onSelect }: SetsScreenProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">フレーズ集を選択</h1>
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
