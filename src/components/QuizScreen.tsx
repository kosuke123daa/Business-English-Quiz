import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditBox } from "@/components/EditBox";
import { shuffle } from "@/utils/shuffle";
import type { CustomMap, Lang, Mark, MarksMap, Phrase } from "@/types";

interface QuizScreenProps {
  phrases: Phrase[];
  marks: MarksMap;
  setMark: (phraseId: number, mark: Mark | null) => void;
  cja: CustomMap;
  setCja: (phraseId: number, value: string | null) => void;
  cen: CustomMap;
  setCen: (phraseId: number, value: string | null) => void;
  fetchGrammar: (phraseId: number, enText: string) => Promise<string>;
  grammar: Record<number, string>;
  grammarLoadingId: number | null;
  onBack: () => void;
}

export function QuizScreen({
  phrases,
  marks,
  setMark,
  cja,
  setCja,
  cen,
  setCen,
  fetchGrammar,
  grammar,
  grammarLoadingId,
  onBack,
}: QuizScreenProps) {
  const [order] = useState(() => shuffle(phrases));
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Lang>("ja"); // "ja" = 日→英, "en" = 英→日

  const current = order[index];

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p>出題するフレーズがありません。</p>
        <Button onClick={onBack}>戻る</Button>
      </div>
    );
  }

  function next() {
    if (index + 1 < order.length) setIndex(index + 1);
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← グループ選択へ
        </Button>
        <span className="text-sm text-gray-500">
          {index + 1} / {order.length}
        </span>
      </div>

      <Tabs value={direction} onValueChange={(v) => setDirection(v as Lang)}>
        <TabsList>
          <TabsTrigger value="ja">日→英</TabsTrigger>
          <TabsTrigger value="en">英→日</TabsTrigger>
        </TabsList>
      </Tabs>

      <QuizCard
        key={current.id}
        phrase={current}
        direction={direction}
        mark={marks[current.id]}
        onMark={(value) => {
          setMark(current.id, value);
          next();
        }}
        cjaValue={cja[current.id]}
        setCja={(v) => setCja(current.id, v)}
        cenValue={cen[current.id]}
        setCen={(v) => setCen(current.id, v)}
        fetchGrammar={fetchGrammar}
        grammar={grammar[current.id]}
        grammarLoading={grammarLoadingId === current.id}
      />
    </div>
  );
}

interface QuizCardProps {
  phrase: Phrase;
  direction: Lang;
  mark: Mark | undefined;
  onMark: (value: Mark) => void;
  cjaValue: string | undefined;
  setCja: (value: string | null) => void;
  cenValue: string | undefined;
  setCen: (value: string | null) => void;
  fetchGrammar: (phraseId: number, enText: string) => Promise<string>;
  grammar: string | undefined;
  grammarLoading: boolean;
}

function QuizCard({
  phrase,
  direction,
  mark,
  onMark,
  cjaValue,
  setCja,
  cenValue,
  setCen,
  fetchGrammar,
  grammar,
  grammarLoading,
}: QuizCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState<"en" | "ja" | null>(null);
  const [showGrammar, setShowGrammar] = useState(false);

  const enText = useMemo(() => cenValue ?? phrase.en, [cenValue, phrase.en]);
  const jaText = useMemo(() => cjaValue ?? phrase.ja, [cjaValue, phrase.ja]);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <div className="rounded-lg border p-6 text-center flex flex-col gap-4">
      {mark && (
        <Badge variant={mark === "o" ? "success" : "destructive"}>
          {mark === "o" ? "✅ 正解済み" : "❌ 不正解済み"}
        </Badge>
      )}

      {editing === "en" ? (
        <EditBox
          value={enText}
          onSave={(v) => {
            setCen(v === phrase.en ? null : v);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div className="flex items-center justify-center gap-2">
          <p className="text-lg">{direction === "ja" ? (revealed ? enText : "?") : enText}</p>
          <Button variant="ghost" size="icon" onClick={() => speak(enText)}>
            🔊
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setEditing("en")}>
            ✏️
          </Button>
        </div>
      )}

      {editing === "ja" ? (
        <EditBox
          value={jaText}
          onSave={(v) => {
            setCja(v === phrase.ja ? null : v);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div className="flex items-center justify-center gap-2">
          <p className="text-gray-600">{direction === "en" ? (revealed ? jaText : "?") : jaText}</p>
          <Button variant="ghost" size="icon" onClick={() => setEditing("ja")}>
            ✏️
          </Button>
        </div>
      )}

      {!revealed && <Button onClick={() => setRevealed(true)}>答えを見る</Button>}

      {revealed && (
        <div className="flex justify-center gap-4">
          <Button variant="default" onClick={() => onMark("o")}>
            ✅ 正解
          </Button>
          <Button variant="destructive" onClick={() => onMark("x")}>
            ❌ 不正解
          </Button>
        </div>
      )}

      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setShowGrammar(true);
            await fetchGrammar(phrase.id, phrase.en);
          }}
        >
          📖 文法解説を見る
        </Button>
        {showGrammar && (
          <p className="text-sm text-gray-600 mt-2 text-left whitespace-pre-wrap">
            {grammarLoading ? "読み込み中..." : grammar ?? ""}
          </p>
        )}
      </div>
    </div>
  );
}
