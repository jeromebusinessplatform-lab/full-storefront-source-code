import type { Metadata } from "next";
import { Inter, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const robotoCondensed = Roboto_Condensed({ 
  subsets: ["latin"], 
  weight: ["600"],
  variable: "--font-roboto-condensed" 
});

export const metadata: Metadata = {
  title: "Minimalist Store",
  description: "Telegram Ecommerce Mini-App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.variable} ${robotoCondensed.variable}`}>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
