"use client";
import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../lib/firebase";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, (next) => { setUser(next); setChecking(false); }), []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await set(ref(db, `users/${credential.user.uid}`), {
          uid: credential.user.uid, email: credential.user.email, createdAt: Date.now(), status: "active"
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      const code = (err as {code?: string}).code || "";
      setError(code.includes("email-already-in-use") ? "دا ایمیل مخکې ثبت شوی." :
        code.includes("invalid-credential") || code.includes("wrong-password") ? "ایمیل یا پاسورډ ناسم دی." :
        code.includes("weak-password") ? "پاسورډ لږ تر لږه ۶ توري ولري." :
        code.includes("permission-denied") ? "د Database امنیتي Rules اجازه نه ورکوي؛ Rules باید تنظیم شي." :
        "ننوتل بریالي نه شول. د Firebase Authentication او Database تنظیمات وګوره.");
    } finally { setBusy(false); }
  }

  if (checking) return <div className="auth-screen"><div className="auth-card">AFGlion BNB<br/><small>Checking secure session…</small></div></div>;
  if (!user) return <main className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <div className="auth-logo">✦</div><p className="auth-eyebrow">AFGLION BNB</p>
    <h1>{mode === "login" ? "بېرته ښه راغلاست" : "نوی حساب جوړ کړه"}</h1>
    <p className="auth-sub">د خپل حساب لپاره ایمیل او پاسورډ وکاروه.</p>
    <label>ایمیل<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></label>
    <label>پاسورډ<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="لږ تر لږه ۶ توري"/></label>
    {error && <p className="auth-error">{error}</p>}
    <button className="auth-submit" disabled={busy}>{busy ? "مهرباني، انتظار…" : mode==="login" ? "ننوتل" : "حساب جوړول"}</button>
    <p className="auth-switch">{mode==="login"?"حساب نه لرې؟":"حساب لرې؟"} <button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}}>{mode==="login"?"ثبت نام":"ننوتل"}</button></p>
  </form></main>;
  return <><div className="auth-userbar"><span>{user.email}</span><button onClick={()=>signOut(auth)}>وتل</button></div>{children}</>;
}
