import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "./auth-gate";
export const metadata: Metadata = { title: "AFGlion BNB", description: "AFGlion BNB wallet and admin workspace" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ps"><body><AuthGate>{children}</AuthGate></body></html>;
}