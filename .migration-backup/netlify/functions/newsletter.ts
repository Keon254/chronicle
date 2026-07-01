import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { newsletterSubscribers } from "../../db/schema.js";

export default async (request: Request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { email } = await request.json().catch(() => ({ email: "" }));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Invalid email" }, { status: 400 });
  try {
    await db.insert(newsletterSubscribers).values({ email: String(email).toLowerCase(), source: "site" }).onConflictDoNothing();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
};

export const config: Config = {
  path: "/api/newsletter",
};
