import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFindDuplicatesInSet, type DuplicateGroup } from "@/hooks/useFindDuplicatesInSet";
import type { PhraseSet } from "@/types";

interface DuplicateCleanupScreenProps {
  set: PhraseSet;
  onConfirm: (idsToDelete: Set<number>) => void;
  onBack: () => void;
}

export function DuplicateCleanupScreen({ set, onConfirm, onBack }: DuplicateCleanupScreenProps) {
  const { checking, findDuplicates } = useFindDuplicatesInSet();
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    findDuplicates(set.data).then((found) => {
      setGroups(found);
      const defaultSelected = new Set<number>();
      found.forEach((g) => {
        g.ids.slice(1).forEach((id) => defaultSelected.add(id));
      });
      setSelected(defaultSelected);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function findPhrase(id: number) {
    return set.data.find((p) => p.id === id);
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← グループ選択へ
        </Button>
        <h1 className="text-xl font-bold">重複チェック</h1>
      </div>

      {checking && <p className="text-sm text-gray-500">AIで重複をチェック中...</p>}

      {groups !== null && groups.length === 0 && !checking && (
        <p className="text-sm text-gray-500">重複は見つかりませんでした。</p>
      )}

      {groups !== null && groups.length > 0 && (
        <>
          <p className="text-sm text-gray-600">
            削除したいフレーズにチェックを入れて「削除して連番を詰める」を押してください（各グループ最初の1件は未選択がデフォルトです）。
          </p>
          <div className="flex flex-col gap-3">
            {groups.map((g, gi) => (
              <Card key={gi}>
                <CardContent className="pt-4 flex flex-col gap-2">
                  <p className="text-xs text-gray-500">{g.reason}</p>
                  {g.ids.map((id) => {
                    const phrase = findPhrase(id);
                    if (!phrase) return null;
                    return (
                      <label key={id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selected.has(id)}
                          onChange={() => toggle(id)}
                        />
                        <span>
                          <span className="text-gray-400 mr-1">#{id}</span>
                          {phrase.en}
                          <br />
                          <span className="text-gray-600">{phrase.ja}</span>
                        </span>
                      </label>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button disabled={selected.size === 0} onClick={() => onConfirm(selected)}>
              削除して連番を詰める（{selected.size}件削除）
            </Button>
            <Button variant="outline" onClick={onBack}>
              キャンセル
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
