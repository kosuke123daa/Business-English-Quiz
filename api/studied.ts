import { kv } from "@vercel/kv";

export const config = { runtime: "edge" };

const KV_PRE = "beq";

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const setId = url.searchParams.get("setId") ?? "";
  const key = `${KV_PRE}:studied:${setId}`;

  if (req.method === "GET") {
    const data = await kv.get<Record<number, string>>(key);
    return Response.json(data ?? {});
  }

  if (req.method === "POST") {
    const { groupNo, date } = await req.json();
    const current = (await kv.get<Record<number, string>>(key)) ?? {};
    current[groupNo] = date;
    await kv.set(key, current);
    return Response.json({ ok: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
