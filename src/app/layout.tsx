import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PwaInstallBanner } from "@/components/common/PwaInstallBanner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | TalkFriendly",
    default: "TalkFriendly — Professional Mental Wellness Support, Powered by Empathy",
  },
  description: "Your mental wellbeing companion. Check in daily, journal freely, connect with listeners, and grow with your community.",
  keywords: ["mental health", "wellbeing", "mindfulness", "therapy", "support", "journal"],
  authors: [{ name: "TalkFriendly" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    title: "TalkFriendly — Mental Wellbeing Platform",
    description: "Professional mental wellness support, powered by empathy.",
    siteName: "TalkFriendly",
  },
};

export const viewport: Viewport = {
  themeColor: "#B8936E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <PwaInstallBanner />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
