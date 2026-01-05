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
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vybaveno – Váš pokoj hotový bez práce",
    description: "Nahrajte fotku pokoje a náš systém vám navrhne kompletní zařízení včetně montáže.",
    url: "https://vybaveno.yrx.cz",
    siteName: "Vybaveno.cz",
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vybaveno – Váš pokoj hotový bez práce",
    description: "Nahrajte fotku pokoje a náš systém vám navrhne kompletní zařízení včetně montáže.",
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <html lang={lang}>
      <body
        className={`${plusJakartaSans.variable} ${figtree.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
