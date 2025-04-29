import { QueryProvider } from "@/lib/query/query-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Orb Companion App",
  description: "An example application integrating with Orb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  );
}


