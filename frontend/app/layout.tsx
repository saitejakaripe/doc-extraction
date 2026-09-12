import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ledger — Document Extraction Dashboard",
  description: "Upload documents, extract structured data, review and correct.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${plexMono.variable} ${inter.variable} font-body`}>
        <header className="border-b border-rule">
          <div className="mx-auto max-w-5xl px-6 py-5 flex items-baseline justify-between">
            <Link href="/" className="font-display text-2xl text-ink tracking-tight">
              Ledger
            </Link>
            <nav className="flex gap-6 font-mono text-sm text-ink-soft">
              <Link href="/" className="hover:text-ink">
                Dashboard
              </Link>
              <Link href="/upload" className="hover:text-ink">
                Upload
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
