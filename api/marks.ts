import { kv } from "@vercel/kv";

export const config = { runtime: "edge" };

const KV_PRE = "beq";

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const setId = url.searchParams.get("setId") ?? "";
  const key = `${KV_PRE}:marks:${setId}`;

  if (req.method === "GET") {
    const data = await kv.get<Record<number, string>>(key);
    return Response.json(data ?? {});
  }

  if (req.method === "POST") {
    const { phraseId, mark } = await req.json();
    const current = (await kv.get<Record<number, string>>(key)) ?? {};
    if (mark === null) {
      delete current[phraseId];
    } else {
      current[phraseId] = mark;
    }
    await kv.set(key, current);
    return Response.json({ ok: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
