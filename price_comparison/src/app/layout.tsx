import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ItemsProvider } from "@/store/ItemsContext";
import Header from "@/components/Header/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cost Compass - Compare Wholesale Prices",
  description: "Compare prices between Hyperpure and Best Price for wholesale items",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <main className="min-h-screen bg-gray-50">
      <Header />
        <ItemsProvider>
          {children}
        </ItemsProvider>
        {/* <footer className="text-center py-4 text-gray-500 text-sm border-t mt-8 bg-white">
        © 2025 Cost Compass AI - Wholesale Price Comparison Tool
      </footer> */}
      </main>
      </body>
    </html>
  );
}
