export const config = { runtime: "edge" };

const MODEL = "claude-sonnet-4-6";

interface Phrase {
  id: number;
  en: string;
  ja: string;
}

interface DuplicateGroup {
  ids: number[];
  reason: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { phrases } = (await req.json()) as { phrases: Phrase[] };
  if (!Array.isArray(phrases) || phrases.length < 2) {
    return Response.json({ groups: [] });
  }

  const list = phrases.map((p) => `${p.id}: ${p.en} / ${p.ja}`).join("\n");

  const prompt = `以下はビジネス英語フレーズの一覧です（id: 英語 / 日本語）。
${list}

このリストの中で、意味的に重複している（表現や語順は違っても、同じ意味・同じ使用場面を指す）フレーズの組を見つけてください。3つ以上が同じ意味の場合は1つのグループにまとめてください。

JSON配列のみを出力してください。各要素は次の形式です。
{ "ids": [重複しているフレーズのidの配列（2つ以上）], "reason": "重複と判断した理由（日本語1文）" }

重複が見つからない場合は空配列 [] を返してください。説明文やMarkdownのコードブロックは不要で、JSON配列のみを返してください。`;

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

  let groups: DuplicateGroup[];
  try {
    groups = match ? JSON.parse(match[0]) : [];
  } catch {
    groups = [];
  }

  return Response.json({ groups });
}
