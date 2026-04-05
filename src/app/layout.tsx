import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOVA | Modern AI Chatbot",
  description: "A professional and helpful AI assistant designed with a modern interface to solve your queries efficiently.",
  keywords: ["AI", "chatbot", "assistant", "productivity", "Next.js"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
