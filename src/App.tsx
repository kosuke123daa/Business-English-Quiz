import { useState } from "react";
import { BIZ300_DATA } from "@/data/biz300";
import { SetsScreen } from "@/components/SetsScreen";
import { GroupsScreen } from "@/components/GroupsScreen";
import { QuizScreen } from "@/components/QuizScreen";
import { ManagePhrasesScreen } from "@/components/ManagePhrasesScreen";
import { PhraseListScreen } from "@/components/PhraseListScreen";
import { useMarks } from "@/hooks/useMarks";
import { useStudied } from "@/hooks/useStudied";
import { useCustom } from "@/hooks/useCustom";
import { useGrammar } from "@/hooks/useGrammar";
import { useCustomSets } from "@/hooks/useCustomSets";
import { useCategories } from "@/hooks/useCategories";
import { useBuiltinOverride } from "@/hooks/useBuiltinOverride";
import { DuplicateCleanupScreen } from "@/components/DuplicateCleanupScreen";
import { parsePhraseCsv } from "@/utils/csv";
import { makeCustomSetId, pickColor } from "@/utils/customSets";
import type { Mark, MarksMap, CustomMap, Phrase, PhraseSet, Screen } from "@/types";

const BUILTIN_ID = "biz300";

const GROUP_SIZE = 10;

function App() {
  const [screen, setScreen] = useState<Screen>("sets");
  const { customSets, addSet, renameSet, deleteSet, updateData } = useCustomSets();
  const { data: biz300Data, updateData: updateBiz300Data } = useBuiltinOverride(BUILTIN_ID, BIZ300_DATA);
  const BUILTIN_SETS: PhraseSet[] = [{ id: BUILTIN_ID, name: "ビジネス英語300", color: "#2563eb", data: biz300Data }];
  const SETS = [...BUILTIN_SETS, ...customSets];
  const [setId, setSetId] = useState<string>(BUILTIN_SETS[0].id);
  const [groupNo, setGroupNo] = useState<number>(1);
  // null = 通常のグループ全問モード。非nullなら絞り込み対象のmark一覧
  const [studyFilter, setStudyFilter] = useState<Mark[] | null>(null);
  const [studyScope, setStudyScope] = useState<"group" | "set">("group");
  // テーマ別グループ選択時の対象フレーズid（非nullの間はこちらを優先）
  const [categoryFilter, setCategoryFilter] = useState<number[] | null>(null);

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

  function handleUpdateSetData(id: string, data: Phrase[]) {
    if (id === BUILTIN_ID) updateBiz300Data(data);
    else updateData(id, data);
  }

  function handleCleanupDuplicates(idsToDelete: Set<number>) {
    const kept = set.data.filter((p) => !idsToDelete.has(p.id));
    const remap = new Map<number, number>();
    kept.forEach((p, i) => remap.set(p.id, i + 1));
    const newData: Phrase[] = kept.map((p, i) => ({ ...p, id: i + 1 }));

    const remapMap = <T,>(map: Record<number, T>): Record<number, T> => {
      const next: Record<number, T> = {};
      Object.entries(map).forEach(([oldIdStr, value]) => {
        const newId = remap.get(Number(oldIdStr));
        if (newId !== undefined) next[newId] = value;
      });
      return next;
    };

    handleUpdateSetData(setId, newData);
    replaceMarks(remapMap(marks) as MarksMap);
    replaceCja(remapMap(cja) as CustomMap);
    replaceCen(remapMap(cen) as CustomMap);
    setScreen("groups");
  }

  const { marks, setMark, replaceAll: replaceMarks } = useMarks(setId);
  const { studied, recordStudied } = useStudied(setId);
  const { custom: cja, setValue: setCja, replaceAll: replaceCja } = useCustom(setId, "ja");
  const { custom: cen, setValue: setCen, replaceAll: replaceCen } = useCustom(setId, "en");
  const { grammar, loadingId, fetchGrammar } = useGrammar();
  const { categories, generating, generateCategories } = useCategories(setId);

  // v1はシングルセット想定だが将来の複数セット対応に備えてsetId別に保持
  const marksBySet = { [setId]: marks };

  const groupPhrases = set.data.slice((groupNo - 1) * GROUP_SIZE, groupNo * GROUP_SIZE);
  const quizPhrases = (
    categoryFilter
      ? set.data.filter((p) => categoryFilter.includes(p.id))
      : studyFilter
        ? (studyScope === "set" ? set.data : groupPhrases).filter((p) => studyFilter.includes(marks[p.id] as Mark))
        : groupPhrases
  ).filter((p) => marks[p.id] !== "skip");

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
          studied={studied}
          isCustom={customSets.some((s) => s.id === setId)}
          categories={categories}
          categorizing={generating}
          onGenerateCategories={() => generateCategories(set.data)}
          onManagePhrases={() => setScreen("manage")}
          onShowList={() => setScreen("list")}
          onShowDedupe={() => setScreen("dedupe")}
          onSelectGroup={(g) => {
            setGroupNo(g);
            setStudyFilter(null);
            setCategoryFilter(null);
            setScreen("quiz");
            recordStudied(g);
          }}
          onSelectGroupFiltered={(g, marksFilter) => {
            setGroupNo(g);
            setStudyFilter(marksFilter);
            setStudyScope("group");
            setCategoryFilter(null);
            setScreen("quiz");
            recordStudied(g);
          }}
          onSelectSetFiltered={(marksFilter) => {
            setStudyFilter(marksFilter);
            setStudyScope("set");
            setCategoryFilter(null);
            setScreen("quiz");
          }}
          onSelectCategory={(phraseIds) => {
            setCategoryFilter(phraseIds);
            setStudyFilter(null);
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

      {screen === "list" && <PhraseListScreen set={set} onBack={() => setScreen("groups")} />}

      {screen === "dedupe" && (
        <DuplicateCleanupScreen
          set={set}
          onConfirm={handleCleanupDuplicates}
          onBack={() => setScreen("groups")}
        />
      )}
    </div>
  );
}

export default App;
