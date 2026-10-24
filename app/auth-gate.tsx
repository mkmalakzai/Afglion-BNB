"use client";
import { useEffect, useState } from "react";

type TelegramUser = { id: number; first_name: string; last_name: string; username: string; photo_url?: string; isAdmin: boolean };
declare global { interface Window { Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void } } } }

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    async function restore() {
      try {
        const response = await fetch("/api/auth/telegram", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          if (!stopped && data.user) { setUser(data.user); setChecking(false); return true; }
        }
      } catch {}
      return false;
    }
    async function boot() {
      if (await restore()) return;
      let tries = 0;
      const timer = window.setInterval(async () => {
        tries++;
        const webApp = window.Telegram?.WebApp;
        if (webApp?.initData) {
          window.clearInterval(timer);
          try {
            webApp.ready(); webApp.expand();
            const response = await fetch("/api/auth/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ initData: webApp.initData }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Telegram verification failed.");
            if (!stopped) { setUser(data.user); setChecking(false); }
          } catch (e) {
            if (!stopped) { setError(e instanceof Error ? e.message : "Telegram login failed."); setChecking(false); }
          }
        } else if (tries >= 30) {
          window.clearInterval(timer);
          if (!stopped) { setError("دا Mini App د ټیلیګرام له دننه پرانیزه. په عادي براوزر کې د ټیلیګرام حساب تایید نه کېږي."); setChecking(false); }
        }
      }, 300);
    }
    boot();
    return () => { stopped = true; };
  }, []);

  async function logout() {
    await fetch("/api/auth/telegram", { method: "DELETE", credentials: "include" });
    setUser(null);
    setError("د بیا ننوتلو لپاره Mini App د ټیلیګرام له بوټ څخه پرانیزه.");
  }

  if (checking) return <div className="auth-screen"><div className="auth-card"><div className="auth-logo">✦</div><p className="auth-eyebrow">AFGLION BNB</p><h1>ټیلیګرام حساب تاییدېږي…</h1><p className="auth-sub">مهرباني وکړئ څو شېبې انتظار وکړئ.</p></div></div>;
  if (!user) return <main className="auth-screen"><section className="auth-card"><div className="auth-logo">✦</div><p className="auth-eyebrow">AFGLION BNB</p><h1>د ټیلیګرام له لارې ننوتل</h1><p className="auth-sub">{error || "د خپل ټیلیګرام بوټ له لارې Mini App پرانیزه."}</p><p className="auth-sub">حساب په اتومات ډول ستا د تایید شوي Telegram ID له مخې پېژندل کېږي؛ ایمیل او پاسورډ ته اړتیا نشته.</p><a className="auth-submit" href="https://t.me/" style={{display:"grid",placeItems:"center",textDecoration:"none"}}>بېرته ټیلیګرام ته</a></section></main>;
  return <><div className="auth-userbar"><span>{user.first_name} {user.last_name} {user.username ? "@"+user.username : ""} · Telegram ID: {user.id}</span><button onClick={logout}>وتل</button></div>{children}</>;
}
