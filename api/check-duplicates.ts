export const config = { runtime: "edge" };

const MODEL = "claude-sonnet-4-6";

interface ExistingPhrase {
  id: number;
  en: string;
  ja: string;
}

interface Candidate {
  en: string;
  ja: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { existing, candidates } = (await req.json()) as { existing: ExistingPhrase[]; candidates: Candidate[] };

  if (!Array.isArray(existing) || !Array.isArray(candidates) || candidates.length === 0 || existing.length === 0) {
    return Response.json({ duplicates: [] });
  }

  const existingList = existing.map((p) => `${p.id}: ${p.en} / ${p.ja}`).join("\n");
  const candidateList = candidates.map((c, i) => `${i}: ${c.en} / ${c.ja}`).join("\n");

  const prompt = `以下は既存のビジネス英語フレーズ一覧（id: 英語 / 日本語）です。
${existingList}

次に追加しようとしているフレーズ一覧（index: 英語 / 日本語）です。
${candidateList}

追加候補の中で、既存フレーズと意味的に重複している（表現や語順は違っても、同じ意味・同じ使用場面を指す）ものを見つけてください。

JSON配列のみを出力してください。各要素は次の形式です。
{ "candidateIndex": 数値, "existingId": 数値, "reason": "重複と判断した理由（日本語1文）" }

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
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "[]";
  const match = text.match(/\[[\s\S]*\]/);

  let duplicates: { candidateIndex: number; existingId: number; reason: string }[];
  try {
    duplicates = match ? JSON.parse(match[0]) : [];
  } catch {
    duplicates = [];
  }

  return Response.json({ duplicates });
}
