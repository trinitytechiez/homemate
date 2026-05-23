import type { Metadata } from "next";
import { RootProvider } from "./providers/RootProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomeMate - Staff Management",
  description: "A mobile-focused PWA for staff management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
