import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./components/Navbar";
import Footer from "./components/Footer";

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
      <body className="antialiased flex min-h-screen flex-col font-sans">
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
