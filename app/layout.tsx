import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "جَمْرَة — من شرارة إلى أثر",
  description: "فريق جَمْرَة للتسويق والإبداع الرقمي.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
