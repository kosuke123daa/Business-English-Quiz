import { useState } from "react";
import { BIZ300_DATA } from "@/data/biz300";
import { SetsScreen } from "@/components/SetsScreen";
import { GroupsScreen } from "@/components/GroupsScreen";
import { QuizScreen } from "@/components/QuizScreen";
import { useMarks } from "@/hooks/useMarks";
import { useCustom } from "@/hooks/useCustom";
import { useGrammar } from "@/hooks/useGrammar";
import { parsePhraseCsv } from "@/utils/csv";
import { loadCustomSets, saveCustomSets, makeCustomSetId, pickColor } from "@/utils/customSets";
import type { PhraseSet, Screen } from "@/types";

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

  function handleRenameSet(id: string, newName: string) {
    const next = customSets.map((s) => (s.id === id ? { ...s, name: newName } : s));
    setCustomSets(next);
    saveCustomSets(next);
  }

  function handleDeleteSet(id: string) {
    const next = customSets.filter((s) => s.id !== id);
    setCustomSets(next);
    saveCustomSets(next);
    if (setId === id) {
      setSetId(BUILTIN_SETS[0].id);
      setScreen("sets");
    }
  }

  const { marks, setMark } = useMarks(setId);
  const { custom: cja, setValue: setCja } = useCustom(setId, "ja");
  const { custom: cen, setValue: setCen } = useCustom(setId, "en");
  const { grammar, loadingId, fetchGrammar } = useGrammar();

  // v1はシングルセット想定だが将来の複数セット対応に備えてsetId別に保持
  const marksBySet = { [setId]: marks };

  const quizPhrases = wrongMode
    ? set.data.filter((p) => marks[p.id] === "x")
    : set.data.slice((groupNo - 1) * GROUP_SIZE, groupNo * GROUP_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      {screen === "sets" && (
        <SetsScreen
          sets={SETS}
          marksBySet={marksBySet}
          customSetIds={customSets.map((s) => s.id)}
          onSelect={(id) => {
            setSetId(id);
            setScreen("groups");
          }}
          onUploadCsv={handleUploadCsv}
          onRenameSet={handleRenameSet}
          onDeleteSet={handleDeleteSet}
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
