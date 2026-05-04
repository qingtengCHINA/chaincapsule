import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/wallet/WalletProvider";
import Navbar from "@/components/layout/Navbar";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChainCapsule",
  description: "链上时光胶囊 — 把你的话，封存在区块里",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${geist.className} bg-zinc-950 text-zinc-100 antialiased`}>
        <WalletProvider>
          <Navbar />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
