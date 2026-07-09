import type { Metadata } from "next";
import { Geist_Mono, Inter, Lexend } from "next/font/google";
import { SiteFrame } from "@/components/layout/site-frame";
import { Footer } from "@/components/salient/Footer";
import { Header } from "@/components/salient/Header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lexend = Lexend({
  variable: "--font-lexend",
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
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${lexend.variable} ${geistMono.variable} h-full scroll-smooth bg-white antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <SiteFrame header={<Header />} footer={<Footer />}>
          <main className="flex flex-1 flex-col">{children}</main>
        </SiteFrame>
      </body>
    </html>
  );
}
