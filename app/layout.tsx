import type { Metadata } from "next";
import { Space_Grotesk, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/components/wallet/WalletProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-en",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-cn",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ChainCapsule — 链上时光胶囊",
  description: "把你的话，封存在区块里，留给未来。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        {/* Fix wallet extension conflicts — must run before any extension injects */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try{
    var d=Object.getOwnPropertyDescriptor(window,'ethereum');
    if(d&&!d.configurable){
      Object.defineProperty(window,'ethereum',{value:d.value,writable:true,configurable:true,enumerable:true});
    }
  }catch(e){}
  // Also handle solana for Phantom
  try{
    var d2=Object.getOwnPropertyDescriptor(window,'solana');
    if(d2&&!d2.configurable){
      Object.defineProperty(window,'solana',{value:d2.value,writable:true,configurable:true,enumerable:true});
    }
  }catch(e){}
})();
`,
          }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${notoSansSC.variable} bg-[#060608] text-zinc-100 antialiased`}
        style={{ fontFamily: 'var(--font-cn), var(--font-en), system-ui, sans-serif' }}
      >
        <WalletProvider>
          <Navbar />
          <div className="pt-14">
            {children}
          </div>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
