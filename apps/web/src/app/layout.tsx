import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { TabBar } from "@/components/TabBar";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Culturdle — the daily pop-culture puzzle",
  description: "Six puzzles a day: a movie, a song and an icon, in a Global and an India edition. Six guesses, a new hint after every miss.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Culturdle", statusBarStyle: "black-translucent" },
  openGraph: { title: "Culturdle", description: "Guess the film, the song and the icon. Every day." },
};

export const viewport: Viewport = {
  themeColor: "#0E1116",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `try{var t=localStorage.getItem('cd_theme')||'dark';if(t==='system')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${bebas.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-28 pt-[max(env(safe-area-inset-top),12px)]">
          {children}
        </div>
        <TabBar />
      </body>
    </html>
  );
}
