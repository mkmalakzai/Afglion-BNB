import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AuthGate from "./auth-gate";
export const metadata: Metadata = { title: "AFGlion BNB", description: "AFGlion BNB Telegram Mini App" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ps"><body><Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" /><AuthGate>{children}</AuthGate></body></html>;
}
