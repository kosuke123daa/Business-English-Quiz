import { kv } from "@vercel/kv";

export const config = { runtime: "edge" };

const KV_PRE = "beq";
const INDEX_KEY = `${KV_PRE}:sets:index`;

interface StoredSet {
  id: string;
  name: string;
  color: string;
  data: { id: number; en: string; ja: string }[];
}

function setKey(id: string): string {
  return `${KV_PRE}:sets:${id}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "GET") {
    const ids = (await kv.get<string[]>(INDEX_KEY)) ?? [];
    const sets = (await Promise.all(ids.map((id) => kv.get<StoredSet>(setKey(id))))).filter(
      (s): s is StoredSet => s !== null,
    );
    return Response.json(sets);
  }

  if (req.method === "POST") {
    const set: StoredSet = await req.json();
    const ids = (await kv.get<string[]>(INDEX_KEY)) ?? [];
    if (!ids.includes(set.id)) {
      ids.push(set.id);
      await kv.set(INDEX_KEY, ids);
    }
    await kv.set(setKey(set.id), set);
    return Response.json({ ok: true });
  }

  if (req.method === "PATCH") {
    const { id, name } = await req.json();
    const existing = await kv.get<StoredSet>(setKey(id));
    if (!existing) return new Response("Not Found", { status: 404 });
    const updated = { ...existing, name };
    await kv.set(setKey(id), updated);
    return Response.json({ ok: true });
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") ?? "";
    const ids = (await kv.get<string[]>(INDEX_KEY)) ?? [];
    await kv.set(INDEX_KEY, ids.filter((existingId) => existingId !== id));
    await kv.del(setKey(id));
    return Response.json({ ok: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
