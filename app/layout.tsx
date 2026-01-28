import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { UmamiScript } from "@/components/UmamiScript";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/ui/Navigation";
import { Footer } from "@/components/ui/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mine Dine - Supper Club Facilitator",
    template: "%s | Mine Dine",
  },
  description:
    "Connect with hosts and discover unique, personalized dining experiences. Join exclusive supper clubs and create unforgettable memories.",
  keywords: [
    "supper club",
    "dining experience",
    "private chef",
    "food events",
    "culinary experiences",
  ],
  authors: [{ name: "Mine Dine" }],
  creator: "Mine Dine",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://minedine.com",
    siteName: "Mine Dine",
    title: "Mine Dine - Supper Club Facilitator",
    description:
      "Connect with hosts and discover unique, personalized dining experiences.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mine Dine - Supper Club Facilitator",
    description:
      "Connect with hosts and discover unique, personalized dining experiences.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0D12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col antialiased">
        <UmamiScript />
        <ThemeProvider>
          <Navigation />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
