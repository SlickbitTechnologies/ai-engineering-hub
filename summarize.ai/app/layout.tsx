import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import ReduxProvider from './redux/provider'
import { AuthProvider } from './context/AuthContext'

const montserrat = Montserrat({ 
  subsets: ['latin'], 
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'] 
})

export const metadata: Metadata = {
  title: 'Summarize.AI - Summarize Anything, Instantly!',
  description: 'A multi-functional tool designed to generate quick summaries from websites, PDFs, audio files, and text, with instant translation services.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Script to prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  console.error('Theme initialization failed:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${montserrat.variable} dot-pattern`}>
        <ReduxProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  )
} 