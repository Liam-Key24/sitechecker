import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/Navbar";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SiteCheck – Find local businesses to help online",
  description: "Discover local businesses and see how their websites perform. Prioritise outreach with web standards and performance insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <header className="absolute top-0 left-0 right-0 z-10">
          <Navbar />
        </header>
        <main id="main-content" className="flex-1 pb-32" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
