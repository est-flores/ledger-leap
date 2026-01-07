import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "LedgerLeap - Convert Bank Statements to Excel",
    template: "%s | LedgerLeap",
  },
  description:
    "Instantly convert your PDF bank statements to formatted Excel spreadsheets using AI. Get 3 free credits when you sign up.",
  keywords: [
    "bank statement converter",
    "PDF to Excel",
    "bank statement to spreadsheet",
    "financial data extraction",
    "AI document processing",
  ],
  authors: [{ name: "LedgerLeap" }],
  creator: "LedgerLeap",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ledgerleap.com",
    title: "LedgerLeap - Convert Bank Statements to Excel",
    description:
      "Instantly convert your PDF bank statements to formatted Excel spreadsheets using AI.",
    siteName: "LedgerLeap",
  },
  twitter: {
    card: "summary_large_image",
    title: "LedgerLeap - Convert Bank Statements to Excel",
    description:
      "Instantly convert your PDF bank statements to formatted Excel spreadsheets using AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-950 text-white`}
      >
        <AuthProvider>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
