import { useState } from "react";
import { BIZ300_DATA } from "@/data/biz300";
import { SetsScreen } from "@/components/SetsScreen";
import { GroupsScreen } from "@/components/GroupsScreen";
import { QuizScreen } from "@/components/QuizScreen";
import { ManagePhrasesScreen } from "@/components/ManagePhrasesScreen";
import { useMarks } from "@/hooks/useMarks";
import { useCustom } from "@/hooks/useCustom";
import { useGrammar } from "@/hooks/useGrammar";
import { useCustomSets } from "@/hooks/useCustomSets";
import { parsePhraseCsv } from "@/utils/csv";
import { makeCustomSetId, pickColor } from "@/utils/customSets";
import type { Phrase, PhraseSet, Screen } from "@/types";

const BUILTIN_SETS: PhraseSet[] = [
  { id: "biz300", name: "ビジネス英語300", color: "#2563eb", data: BIZ300_DATA },
  // 新セットはここに追加
];

const GROUP_SIZE = 10;

function App() {
  const [screen, setScreen] = useState<Screen>("sets");
  const { customSets, addSet, renameSet, deleteSet, updateData } = useCustomSets();
  const SETS = [...BUILTIN_SETS, ...customSets];
  const [setId, setSetId] = useState<string>(BUILTIN_SETS[0].id);
  const [groupNo, setGroupNo] = useState<number>(1);
  const [wrongMode, setWrongMode] = useState(false);
  const [groupWrongMode, setGroupWrongMode] = useState(false);

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
    await addSet(newSet);
  }

  function handleCreateEmptySet(name: string) {
    const id = makeCustomSetId(name, SETS.map((s) => s.id));
    const newSet: PhraseSet = { id, name, color: pickColor(customSets.length), data: [] };
    addSet(newSet);
  }

  function handleRenameSet(id: string, newName: string) {
    renameSet(id, newName);
  }

  function handleDeleteSet(id: string) {
    deleteSet(id);
    if (setId === id) {
      setSetId(BUILTIN_SETS[0].id);
      setScreen("sets");
    }
  }

  function handleAddPhrases(newPhrases: { en: string; ja: string }[]) {
    if (newPhrases.length === 0) return;
    let nextId = set.data.length === 0 ? 1 : Math.max(...set.data.map((p) => p.id)) + 1;
    const added: Phrase[] = newPhrases.map((p) => ({ id: nextId++, en: p.en, ja: p.ja }));
    updateData(setId, [...set.data, ...added]);
  }

  function handleDeletePhrase(phraseId: number) {
    const next = set.data.filter((p) => p.id !== phraseId);
    updateData(setId, next);
  }

  const { marks, setMark } = useMarks(setId);
  const { custom: cja, setValue: setCja } = useCustom(setId, "ja");
  const { custom: cen, setValue: setCen } = useCustom(setId, "en");
  const { grammar, loadingId, fetchGrammar } = useGrammar();

  // v1はシングルセット想定だが将来の複数セット対応に備えてsetId別に保持
  const marksBySet = { [setId]: marks };

  const groupPhrases = set.data.slice((groupNo - 1) * GROUP_SIZE, groupNo * GROUP_SIZE);
  const quizPhrases = wrongMode
    ? set.data.filter((p) => marks[p.id] === "x")
    : groupWrongMode
      ? groupPhrases.filter((p) => marks[p.id] === "x")
      : groupPhrases;

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
          onCreateEmptySet={handleCreateEmptySet}
          onRenameSet={handleRenameSet}
          onDeleteSet={handleDeleteSet}
        />
      )}

      {screen === "groups" && (
        <GroupsScreen
          set={set}
          marks={marks}
          isCustom={customSets.some((s) => s.id === setId)}
          onManagePhrases={() => setScreen("manage")}
          onSelectGroup={(g) => {
            setGroupNo(g);
            setWrongMode(false);
            setGroupWrongMode(false);
            setScreen("quiz");
          }}
          onSelectGroupWrongMode={(g) => {
            setGroupNo(g);
            setWrongMode(false);
            setGroupWrongMode(true);
            setScreen("quiz");
          }}
          onSelectWrongMode={() => {
            setWrongMode(true);
            setGroupWrongMode(false);
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

      {screen === "manage" && (
        <ManagePhrasesScreen
          set={set}
          onAddPhrases={handleAddPhrases}
          onDeletePhrase={handleDeletePhrase}
          onBack={() => setScreen("groups")}
        />
      )}
    </div>
  );
}

export default App;
