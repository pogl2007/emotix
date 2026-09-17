import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import { AuthProvider } from "@/lib/auth";
import SiteHeader from "@/components/ui/SiteHeader";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EMOTIX — распознавание эмоций",
  description:
    "Загрузи фото или видео — нейросеть определит эмоции каждого человека в кадре.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg text-text antialiased">
        <AuthProvider>
          <SiteHeader />
          <main className="pt-14">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
