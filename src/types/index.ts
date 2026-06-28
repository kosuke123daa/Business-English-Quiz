export type Mark = "o" | "x";
export type Lang = "ja" | "en";
export type QuizMode = "group" | "wrong";
export type Screen = "sets" | "groups" | "quiz" | "manage" | "list";

export interface Phrase {
  id: number;
  en: string;
  ja: string;
}

export interface PhraseSet {
  id: string;
  name: string;
  color: string;
  data: Phrase[];
}

export interface MarksMap {
  [phraseId: number]: Mark;
}

export interface CustomMap {
  [phraseId: number]: string;
}

export interface GrammarMap {
  [grammarKey: string]: string;
}

export interface DuplicateMatch {
  candidateIndex: number;
  existingId: number;
  reason: string;
}
