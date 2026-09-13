import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { GlobalDisclaimer } from "@/components/common/GlobalDisclaimer";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import {
  THEME_COOKIE_KEY,
  resolveTheme,
  type Theme,
} from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LawPilot | Understand. Verify. Act.",
  description:
    "A GenAI-powered legal information and document assistance platform. Understand the fine print, verify the legal context, and know what to do next.",
  keywords: [
    "legal technology",
    "contract review",
    "legal AI",
    "evidence chain",
    "clause analysis",
    "lawyer brief",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_KEY)?.value;
  const initialTheme: Theme = resolveTheme(themeCookie);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${initialTheme}`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0C0E14] dark:text-slate-100 font-sans">
        <ThemeProvider initialTheme={initialTheme}>
          <GlobalDisclaimer />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
