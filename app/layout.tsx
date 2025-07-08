import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "हनुमान चालीसा संकल्प ट्रैकर",
  description:
    "अपने हनुमान चालीसा संकल्प की प्रगति को ट्रैक करें और प्रेरित रहें। Hanuman Chalisa Sankalp Tracker for daily spiritual progress.",
  openGraph: {
    title: "हनुमान चालीसा संकल्प ट्रैकर",
    description:
      "अपने हनुमान चालीसा संकल्प की प्रगति को ट्रैक करें और प्रेरित रहें। Hanuman Chalisa Sankalp Tracker for daily spiritual progress.",
    url: "https://hanumanchalisasankalp.vercel.app", // Replace with your actual domain
    siteName: "हनुमान चालीसा संकल्प ट्रैकर",
    images: [
      {
        url: "/image.png", // Make sure public/image.png exists
        width: 1200,
        height: 630,
        alt: "हनुमान चालीसा संकल्प ट्रैकर",
      },
    ],
    locale: "hi_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "हनुमान चालीसा संकल्प ट्रैकर",
    description:
      "अपने हनुमान चालीसा संकल्प की प्रगति को ट्रैक करें और प्रेरित रहें। Hanuman Chalisa Sankalp Tracker for daily spiritual progress.",
    images: ["/image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <head>
        {/* Extra meta tags for SEO and social sharing */}
        <meta name="theme-color" content="#FF6F00" />
        <meta
          name="keywords"
          content="हनुमान चालीसा, संकल्प, ट्रैकर, Hanuman Chalisa, Sankalp, Tracker, Bhakti, Spiritual, Hindu"
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/image.png" />
        <meta property="twitter:image" content="/image.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
