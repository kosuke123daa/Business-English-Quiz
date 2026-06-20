import { useRef, useState } from "react";
import { BIZ300_DATA } from "@/data/biz300";
import { SetsScreen } from "@/components/SetsScreen";
import { GroupsScreen } from "@/components/GroupsScreen";
import { QuizScreen } from "@/components/QuizScreen";
import { Button } from "@/components/ui/button";
import { useMarks } from "@/hooks/useMarks";
import { useCustom } from "@/hooks/useCustom";
import { useGrammar } from "@/hooks/useGrammar";
import { parsePhraseCsv } from "@/utils/csv";
import { loadCustomSets, saveCustomSets, makeCustomSetId, pickColor } from "@/utils/customSets";
import type { ExportRecord, PhraseSet, Screen } from "@/types";

const BUILTIN_SETS: PhraseSet[] = [
  { id: "biz300", name: "ビジネス英語300", color: "#2563eb", data: BIZ300_DATA },
  // 新セットはここに追加
];

const GROUP_SIZE = 20;

function App() {
  const [screen, setScreen] = useState<Screen>("sets");
  const [customSets, setCustomSets] = useState<PhraseSet[]>(() => loadCustomSets());
  const SETS = [...BUILTIN_SETS, ...customSets];
  const [setId, setSetId] = useState<string>(SETS[0].id);
  const [groupNo, setGroupNo] = useState<number>(1);
  const [wrongMode, setWrongMode] = useState(false);

  const set = SETS.find((s) => s.id === setId)!;

  async function handleUploadCsv(file: File) {
    const text = await file.text();
    const data = parsePhraseCsv(text);
    if (data.length === 0) {
      window.alert("CSVを読み取れませんでした。「連番,英語フレーズ,日本語フレーズ」の3列構成にしてください。");
      return;
    }
    const name = file.name.replace(/\.csv$/i, "");
    const id = makeCustomSetId(name, SETS.map((s) => s.id));
    const newSet: PhraseSet = { id, name, color: pickColor(customSets.length), data };
    const next = [...customSets, newSet];
    setCustomSets(next);
    saveCustomSets(next);
  }

  const { marks, setMark } = useMarks(setId);
  const { custom: cja, setValue: setCja } = useCustom(setId, "ja");
  const { custom: cen, setValue: setCen } = useCustom(setId, "en");
  const { grammar, loadingId, fetchGrammar } = useGrammar();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // v1はシングルセット想定だが将来の複数セット対応に備えてsetId別に保持
  const marksBySet = { [setId]: marks };

  const quizPhrases = wrongMode
    ? set.data.filter((p) => marks[p.id] === "x")
    : set.data.slice((groupNo - 1) * GROUP_SIZE, groupNo * GROUP_SIZE);

  function handleExport() {
    const records: ExportRecord[] = set.data.map((p) => {
      const gNo = Math.floor((p.id - 1) / GROUP_SIZE) + 1;
      return {
        setId: set.id,
        groupNo: gNo,
        phraseId: p.id,
        en: cen[p.id] ?? p.en,
        ja: cja[p.id] ?? p.ja,
        mark: marks[p.id] ?? null,
        grammar: grammar[p.id] ?? null,
      };
    });
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${set.id}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    const records: ExportRecord[] = JSON.parse(text);
    for (const r of records) {
      const original = set.data.find((p) => p.id === r.phraseId);
      if (!original) continue;
      if (r.en !== original.en) await setCen(r.phraseId, r.en);
      if (r.ja !== original.ja) await setCja(r.phraseId, r.ja);
      if (r.mark !== marks[r.phraseId]) await setMark(r.phraseId, r.mark);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-end gap-2 p-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          📤 エクスポート
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          📥 インポート
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {screen === "sets" && (
        <SetsScreen
          sets={SETS}
          marksBySet={marksBySet}
          onSelect={(id) => {
            setSetId(id);
            setScreen("groups");
          }}
          onUploadCsv={handleUploadCsv}
        />
      )}

      {screen === "groups" && (
        <GroupsScreen
          set={set}
          marks={marks}
          onSelectGroup={(g) => {
            setGroupNo(g);
            setWrongMode(false);
            setScreen("quiz");
          }}
          onSelectWrongMode={() => {
            setWrongMode(true);
            setScreen("quiz");
          }}
          onBack={() => setScreen("sets")}
        />
      )}

      {screen === "quiz" && (
        <QuizScreen
          phrases={quizPhrases}
          marks={marks}
          setMark={setMark}
          cja={cja}
          setCja={setCja}
          cen={cen}
          setCen={setCen}
          fetchGrammar={fetchGrammar}
          grammar={grammar}
          grammarLoadingId={loadingId}
          onBack={() => setScreen("groups")}
        />
      )}
    </div>
  );
}

export default App;
