
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// AuthProvider is removed from here, will be in specific layouts
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
};

export default function RootLayout({
  children,
}: Readonly<{

  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
 <head>
 <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2767183690825400"
 crossOrigin="anonymous"></script>
 </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* AuthProvider removed from here */}
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}

