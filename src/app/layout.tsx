import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import CookieConsent from "@/components/CookieConsent";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { getSiteUrl } from "@/lib/siteUrl";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "School AI — one chat that learns your classes",
    template: "%s — School AI",
  },
  description: "One chat that learns how each student's teachers, classes, curriculum, and assessment style actually work.",
  robots: { index: false, follow: false }, // most routes are behind auth; per-page overrides opt public pages back in
  openGraph: {
    siteName: "School AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "School AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#050506",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-white text-zinc-900 dark:bg-[#212121] dark:text-zinc-50">
        <AuthProvider>{children}</AuthProvider>
        <CookieConsent />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
