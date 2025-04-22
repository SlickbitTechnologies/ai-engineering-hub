import { Geist, Geist_Mono } from "next/font/google";
import ReduxProvider from "@/components/providers/ReduxProvider";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import InitializeApp from '@/components/InitializeApp';

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ReduxProvider>
          <InitializeApp />
          {children}
          <Toaster position="top-right" />
        </ReduxProvider>
      </body>
    </html>
  );
}
