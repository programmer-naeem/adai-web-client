import type { Metadata } from "next";
import { Hind_Siliguri, Red_Hat_Mono } from "next/font/google";
import bn from "../../messages/bn.json";
import "./globals.css";

const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

const mono = Red_Hat_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-red-hat",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: bn.meta.title,
  description: bn.meta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${hind.variable} ${mono.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
