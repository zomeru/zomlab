import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZomLab — Interactive Engineering Lab",
  description: "A personal software engineering laboratory and interactive knowledge base.",
};

const NAV_ITEMS = [
  { label: "Getting Started", href: "/" },
  { label: "Status", href: "/status" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="flex h-14 items-center border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            ZomLab
          </Link>
          <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
            Interactive Engineering Lab
          </span>
        </header>

        <div className="flex flex-1">
          <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-zinc-50/50 p-4 md:block dark:border-zinc-800 dark:bg-zinc-900/30">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
