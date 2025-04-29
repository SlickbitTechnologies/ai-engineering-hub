import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Authentication - VaultRedact",
  description: "Sign in or register for VaultRedact document redaction platform",
};

export default function AuthLayout({ children }) {
  return (
    <div className="h-screen w-full">
      {children}
    </div>
  );
} 