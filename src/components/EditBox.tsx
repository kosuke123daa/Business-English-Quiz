import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface EditBoxProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

export function EditBox({ value, onSave, onCancel }: EditBoxProps) {
  const [draft, setDraft] = useState(value);

  return (
    <div className="flex flex-col gap-2">
      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>
          キャンセル
        </Button>
        <Button size="sm" onClick={() => onSave(draft)}>
          保存
        </Button>
      </div>
    </div>
  );
}
