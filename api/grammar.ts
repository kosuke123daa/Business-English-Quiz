import { kv } from "@vercel/kv";

export const config = { runtime: "edge" };

const KV_PRE = "beq";
const MODEL = "claude-sonnet-4-6";

// 同じphraseIdでも英文を編集した場合は別キャッシュとして扱う（編集前の解説は残したまま新しい解説を作る）
function hashText(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (h * 33) ^ text.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function cacheKey(phraseId: number, enText: string): string {
  return `${KV_PRE}:gc:${phraseId}:${hashText(enText)}`;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // GET: キャッシュ確認
  if (req.method === "GET") {
    const pid = Number(url.searchParams.get("phraseId"));
    const enText = url.searchParams.get("enText") ?? "";
    const cached = await kv.get<string>(cacheKey(pid, enText));
    return Response.json({ grammar: cached ?? null });
  }

  // POST: 未キャッシュなら Anthropic API 呼び出し（force指定時はキャッシュを無視して再生成）
  if (req.method === "POST") {
    const { phraseId, enText, force } = await req.json();
    const key = cacheKey(phraseId, enText);
    if (!force) {
      const cached = await kv.get<string>(key);
      if (cached) return Response.json({ grammar: cached });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
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

    const data = await res.json();
    const grammar = data.content?.[0]?.text ?? "取得できませんでした。";
    await kv.set(key, grammar);
    return Response.json({ grammar });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

