import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SiteFrame } from "@/components/layout/site-frame";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Author Website Analyzer | GrailHiiv",
  description:
    "An author-focused website scorecard for book promotion, reader growth, trust, SEO, mobile experience, and website health.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteFrame header={<Header />} footer={<Footer />}>
          <main className="flex flex-1 flex-col">{children}</main>
        </SiteFrame>
      </body>
    </html>
  );
}
