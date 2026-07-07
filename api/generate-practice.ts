export const config = { runtime: "edge" };

const MODEL = "claude-sonnet-4-6";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { grammarDescription } = await req.json();
  if (!grammarDescription) return Response.json({ error: "grammarDescription is required" }, { status: 400 });

  const prompt = `ビジネスシーンの日→英練習問題を10問作ってください。

【文法・表現のテーマ】
${grammarDescription}

【条件】
- 疑問文・過去形・未来形・5W1H・依頼・提案など、なるべく多様な文パターンを混ぜること
- 全てビジネスの会話で実際に使う自然なフレーズにすること
- 難易度は中級ビジネスパーソン向け

【出力形式】
以下のJSONのみを返してください。他のテキストは一切不要です。
{"phrases":[{"ja":"日本語フレーズ","en":"English phrase"},{"ja":"...","en":"..."}]}`;

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

  if (!res.ok) return Response.json({ error: "Anthropic API error" }, { status: 500 });

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON");
    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "parse error", raw: text }, { status: 500 });
  }
}
