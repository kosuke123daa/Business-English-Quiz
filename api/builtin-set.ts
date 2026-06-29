import { kv } from "@vercel/kv";

export const config = { runtime: "edge" };

const KV_PRE = "beq";

function key(id: string): string {
  return `${KV_PRE}:builtin:${id}`;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";

  if (req.method === "GET") {
    const data = await kv.get(key(id));
    return Response.json(data ?? null);
  }

  if (req.method === "PUT") {
    const data = await req.json();
    await kv.set(key(id), data);
    return Response.json({ ok: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
