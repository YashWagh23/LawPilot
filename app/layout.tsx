import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { GlobalDisclaimer } from "@/components/common/GlobalDisclaimer";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

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

const themeInitializerScript = `
(function() {
  try {
    var saved = localStorage.getItem('lawpilot-theme');
    var theme = (saved === 'dark' || saved === 'light') ? saved : 'light';
    var root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0C0E14] dark:text-slate-100 font-sans">
        <Script
          id="lawpilot-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitializerScript }}
        />
        <ThemeProvider>
          <GlobalDisclaimer />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
