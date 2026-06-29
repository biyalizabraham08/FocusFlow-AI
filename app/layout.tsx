import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { VoiceAssistant } from "@/components/dashboard/voice-assistant";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FocusFlow AI",
  description: "Your intelligent execution coach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          {children}
          <VoiceAssistant />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
