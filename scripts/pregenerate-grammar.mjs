/**
 * 文法解説プリジェネレーター
 *
 * 事前準備:
 *   vercel env pull .env.local   # ANTHROPIC_API_KEY + KV_REST_API_URL/TOKEN を取得
 *
 * 実行方法:
 *   node scripts/pregenerate-grammar.mjs
 *
 * id 1〜255 (単語のみの 256〜275 は除外) の文法解説を生成し、
 * api/grammar.ts と同一のキャッシュキー形式で Vercel KV に書き込む。
 * 既にキャッシュ済みのものはスキップするので何度でも再実行可能。
 */

import { readFileSync } from "fs";

// .env.local を手動パース（dotenv 不要）
try {
  const env = readFileSync(".env.local", "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch {
  // .env.local がなくても環境変数が既に設定されていれば OK
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY が未設定です");
if (!KV_REST_API_URL || !KV_REST_API_TOKEN) throw new Error("KV_REST_API_URL / KV_REST_API_TOKEN が未設定です");

const MODEL = "claude-sonnet-4-6";
const KV_PRE = "beq";
const WORD_ONLY_START_ID = 256; // このID以降は単語のみエントリのためスキップ
const DELAY_MS = 300; // レート制限を避けるための間隔

// api/grammar.ts の hashText と同一実装
function hashText(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (h * 33) ^ text.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function cacheKey(phraseId, enText) {
  return `${KV_PRE}:gc:${phraseId}:${hashText(enText)}`;
}

// Vercel KV REST API 経由で get/set
async function kvGet(key) {
  const res = await fetch(`${KV_REST_API_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
  });
  const json = await res.json();
  return json.result ?? null;
}

async function kvSet(key, value) {
  const res = await fetch(`${KV_REST_API_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([value]),
  });
  if (!res.ok) throw new Error(`KV set failed: ${res.status} ${await res.text()}`);
}

async function generateGrammar(enText) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `ビジネス英語学習者向けに以下フレーズの文法ポイントを日本語で3〜5文で解説してください。Markdown記法（**太字**、##見出しなど）は使わず、プレーンテキストのみで答えてください。\n\n${enText}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "取得できませんでした。";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// biz300.ts の RAW をパース
function parseBiz300() {
  const src = readFileSync("src/data/biz300.ts", "utf-8");
  const match = src.match(/const RAW = `([\s\S]*?)`/);
  if (!match) throw new Error("RAW が見つかりません");
  return match[1]
    .split("\n")
    .filter(Boolean)
    .map((line, i) => {
      const p = line.indexOf("|");
      return { id: i + 1, en: line.slice(0, p), ja: line.slice(p + 1) };
    });
}

async function main() {
  const phrases = parseBiz300().filter((p) => p.id < WORD_ONLY_START_ID);
  console.log(`対象フレーズ数: ${phrases.length} (id 1〜${WORD_ONLY_START_ID - 1})`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const phrase of phrases) {
    const key = cacheKey(phrase.id, phrase.en);
    const cached = await kvGet(key);
    if (cached) {
      process.stdout.write(`[skip] id=${phrase.id}\r`);
      skipped++;
      continue;
    }

    try {
      const grammar = await generateGrammar(phrase.en);
      await kvSet(key, grammar);
      generated++;
      console.log(`[ok] id=${phrase.id} (${generated + skipped}/${phrases.length}) ${phrase.en.slice(0, 40)}`);
    } catch (e) {
      failed++;
      console.error(`[error] id=${phrase.id}: ${e.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n完了: 生成=${generated}, スキップ=${skipped}, エラー=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
