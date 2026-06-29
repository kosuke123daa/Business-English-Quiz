import { kv } from "@vercel/kv";

export const config = { runtime: "edge" };

const MODEL = "claude-sonnet-4-6";
const KV_PRE = "beq";

interface Phrase {
  id: number;
  en: string;
  ja: string;
}

interface CategoryGroup {
  category: string;
  phraseIds: number[];
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const setId = url.searchParams.get("setId") ?? "";
  const key = `${KV_PRE}:categories:${setId}`;

  if (req.method === "GET") {
    const data = await kv.get<CategoryGroup[]>(key);
    return Response.json(data ?? []);
  }

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { phrases } = (await req.json()) as { phrases: Phrase[] };
  if (!Array.isArray(phrases) || phrases.length === 0) {
    return Response.json([]);
  }

  const list = phrases.map((p) => `${p.id}: ${p.en} / ${p.ja}`).join("\n");

  const prompt = `以下はビジネス英語フレーズの一覧です（id: 英語 / 日本語）。
${list}

これらを意味・使用場面が似ているもの同士でグループ分けしてください。1グループあたり5〜20個程度を目安にし、全フレーズを必ずどこかのグループに含めてください（漏れなく分類）。

JSON配列のみを出力してください。各要素は次の形式です。
{ "category": "グループ名（日本語、簡潔に）", "phraseIds": [対象フレーズのidの配列] }

説明文やMarkdownのコードブロックは不要で、JSON配列のみを返してください。`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "[]";
  const match = text.match(/\[[\s\S]*\]/);

  let groups: CategoryGroup[];
  try {
    groups = match ? JSON.parse(match[0]) : [];
  } catch {
    groups = [];
  }

  await kv.set(key, groups);
  return Response.json(groups);
}
