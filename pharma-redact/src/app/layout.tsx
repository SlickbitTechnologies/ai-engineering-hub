"use client";

import "./globals.css";
import { Providers } from "@/store/providers";
import { AuthProvider } from "@/context/AuthContext";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadDocuments } from "@/store/slices/documentSlice";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>PharmaRedact</title>
        <meta name="description" content="AI-powered document redaction for pharmaceutical submissions" />
        {/* Load Inter font via CSS */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans">
        <Providers>
          <AuthProvider>
            <AppInitializer />
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

// Component to initialize app data
function AppInitializer() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Load documents from local storage on app initialization
    dispatch(loadDocuments() as any);
  }, [dispatch]);
  
  return null;
}
