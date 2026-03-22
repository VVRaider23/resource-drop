import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resource Drop",
  description: "Share useful links with your team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
