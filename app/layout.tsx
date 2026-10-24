import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Afglion-BNB — Members Club",
  description: "Afglion-BNB Telegram Mini App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ps"><body>{children}</body></html>;
}
