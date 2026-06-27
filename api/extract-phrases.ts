export const config = { runtime: "edge" };

const MODEL = "claude-sonnet-4-6";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { imageBase64, mediaType } = (await req.json()) as { imageBase64?: string; mediaType?: string };
  if (!imageBase64 || !mediaType) return Response.json({ phrases: [] });

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
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            {
              type: "text",
              text: `この画像からビジネス英語フレーズとその日本語訳のペアを抽出してください。

JSON配列のみを出力してください。各要素は { "en": "英語フレーズ", "ja": "日本語訳" } の形式です。
英語と日本語の対応関係がはっきり分からないものは含めないでください。
説明文やMarkdownのコードブロックは不要で、JSON配列のみを返してください。読み取れるフレーズが無ければ空配列 [] を返してください。`,
            },
          ],
        },
      ],
    }),
  });

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "[]";
  const match = text.match(/\[[\s\S]*\]/);

  let phrases: { en: string; ja: string }[];
  try {
    phrases = match ? JSON.parse(match[0]) : [];
  } catch {
    phrases = [];
  }

  return Response.json({ phrases });
}
