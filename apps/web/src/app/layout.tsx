import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { PREFS_SCRIPT } from "@/lib/client/prefs";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["600"], variable: "--font-lora", display: "swap" });

export const metadata: Metadata = {
  title: "Culturdle — the daily pop-culture puzzle",
  description: "Guess the film, the song and the icon. Six guesses, a new hint after every miss. Global and India editions, every day.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Culturdle", statusBarStyle: "default" },
  openGraph: { title: "Culturdle", description: "Guess the film, the song and the icon. Every day." },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#121213" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
