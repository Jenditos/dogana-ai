import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DUDI AI Generator",
  description: "Krijo DUDI XML për ASYCUDA automatikisht nga dokumentet e zhdoganimit",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        {children}
        <footer style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          padding: '18px 20px',
          color: 'var(--t4)',
          fontSize: 12,
        }}>
          <a href="/privacy" style={{ color: 'inherit' }}>Privacy</a>
          <a href="/terms" style={{ color: 'inherit' }}>Terms</a>
          <a href="/impressum" style={{ color: 'inherit' }}>Impressum</a>
        </footer>
      </body>
    </html>
  );
}
