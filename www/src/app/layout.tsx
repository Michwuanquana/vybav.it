import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Figtree } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vybaveno – Váš pokoj hotový bez práce",
  description: "Nahrajte fotku pokoje a náš systém vám navrhne kompletní zařízení včetně montáže. Od chaosu ke klidu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body
        className={`${plusJakartaSans.variable} ${figtree.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
