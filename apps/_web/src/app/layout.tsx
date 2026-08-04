import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { GitHubLink } from "@/components/layout/github-link";
import { GlobalSearch } from "@/components/layout/global-search";
import { ProfileButton } from "@/components/layout/profile-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <a
              href="#main"
              className="sr-only rounded-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
              Skip to content
            </a>

            <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex shrink-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="grid size-6 place-items-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground"
                  >
                    Z
                  </span>
                  <span className="text-base font-semibold tracking-tight text-foreground">
                    ZomLab
                  </span>
                </Link>

                <GlobalSearch />

                <div className="ml-auto flex items-center gap-1.5">
                  <GitHubLink />
                  <ThemeToggle />
                  <ProfileButton />
                </div>
              </div>
            </header>

            <div className="mx-auto flex w-full max-w-[1400px] flex-1">
              <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border bg-sidebar px-4 py-6 md:block">
                <SidebarNav />
              </aside>

              <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
                {children}
              </main>
            </div>

            <SiteFooter />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
