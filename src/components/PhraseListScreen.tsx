import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PhraseSet } from "@/types";

interface PhraseListScreenProps {
  set: PhraseSet;
  onBack: () => void;
}

export function PhraseListScreen({ set, onBack }: PhraseListScreenProps) {
  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← グループ選択へ
        </Button>
        <h1 className="text-xl font-bold">{set.name}（全{set.data.length}問）</h1>
      </div>

      <div className="flex flex-col gap-2">
        {set.data.map((phrase) => (
          <Card key={phrase.id}>
            <CardContent className="pt-4 flex gap-3">
              <span className="text-sm text-gray-400 w-10 shrink-0">{phrase.id}</span>
              <div>
                <p>{phrase.en}</p>
                <p className="text-sm text-gray-600">{phrase.ja}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
