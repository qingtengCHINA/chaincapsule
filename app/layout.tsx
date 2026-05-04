import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChainCapsule",
  description: "Time-locked NFT capsules on the blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
