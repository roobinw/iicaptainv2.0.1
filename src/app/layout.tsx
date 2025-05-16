
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth"; // Ensure AuthProvider is here
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iiCaptain | Sports Team Management Software for Easy Organization",
  description: "Organize your sports team effortlessly with iiCaptain. Manage match schedules, training, player rosters, and attendance. Sign up free!",
  keywords: "sports team management, team organization app, iiCaptain, schedule management, player roster, attendance tracking, sports app, team manager, coaching tool",
  icons: {
    icon: '/favicon.ico', // Ensure favicon is correctly referenced
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Removed AdSense script for cleaner testing, can be added back later */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider> {/* AuthProvider wraps all children */}
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
