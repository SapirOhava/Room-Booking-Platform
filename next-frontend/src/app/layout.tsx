import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Monospace fonts are usually useful for:

// - code blocks
// - technical text
// - fixed-width text
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // title shown in browser tab
  title: "Room Booking App",
  // description used by search engines / previews
  description: "Search and book rooms app by sapir ohava",
};

// RootLayout - the root layout for the whole app
// children - the current page/route content
// Readonly<...> - TypeScript saying: treat the props object as read-only
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
