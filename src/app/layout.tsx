import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foun — Twój AI Cofounder",
  description: "Asystent AI dla założycieli startupów. Planuj, strategizuj i buduj z inteligentnym cofunderem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
