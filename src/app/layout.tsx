import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const biroScript = localFont({
  src: "../../public/fonts/Biro_Script_reduced.ttf",
  variable: "--font-biro",
});

const chunkyPuffly = localFont({
  src: "../../public/fonts/ChunkypufflyRegular-drB0l.otf",
  variable: "--font-chunky",
});

export const metadata: Metadata = {
  title: "Bloom",
  description: "Bloom",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${biroScript.variable} ${chunkyPuffly.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
