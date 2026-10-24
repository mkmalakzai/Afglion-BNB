import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const COOKIE = "afglion_tg_session";
type TgUser = { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string };

function sign(value: string, token: string) {
  return createHmac("sha256", token).update(value).digest("hex");
}
function isAdmin(id: number) {
  const allowed = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(x => x.trim()).filter(Boolean);
  return allowed.includes(String(id));
}
function verifyInitData(initData: string, token: string): TgUser | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");
    const authDate = Number(params.get("auth_date") || 0);
    if (!authDate || Math.abs(Date.now() / 1000 - authDate) > 86400) return null;
    const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
    const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
    const expected = createHmac("sha256", secretKey).update(dataCheckString).digest();
    const supplied = Buffer.from(hash, "hex");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    const rawUser = params.get("user");
    if (!rawUser) return null;
    const user = JSON.parse(rawUser) as TgUser;
    if (!Number.isSafeInteger(user.id)) return null;
    return user;
  } catch { return null; }
}
function safeUser(user: TgUser) {
  return { id: user.id, first_name: user.first_name || "Telegram user", last_name: user.last_name || "", username: user.username || "", photo_url: user.photo_url || "", isAdmin: isAdmin(user.id) };
}

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "Telegram bot token is not configured on the server." }, { status: 503 });
  let body: { initData?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const user = verifyInitData(body.initData || "", token);
  if (!user) return NextResponse.json({ error: "Telegram login could not be verified. Open the app from your Telegram bot and try again." }, { status: 401 });
  const payload = Buffer.from(JSON.stringify({ user: safeUser(user), exp: Math.floor(Date.now() / 1000) + 86400 })).toString("base64url");
  const signature = sign(payload, token);
  const response = NextResponse.json({ user: safeUser(user) });
  response.cookies.set(COOKIE, `${payload}.${signature}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 86400 });
  return response;
}

export async function GET(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ user: null }, { status: 503 });
  const value = request.cookies.get(COOKIE)?.value || "";
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return NextResponse.json({ user: null }, { status: 401 });
  const expected = sign(payload, token);
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ user: null }, { status: 401 });
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { user: TgUser; exp: number };
    if (!data.exp || data.exp < Date.now() / 1000 || !data.user?.id) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user: safeUser(data.user) });
  } catch { return NextResponse.json({ user: null }, { status: 401 }); }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
