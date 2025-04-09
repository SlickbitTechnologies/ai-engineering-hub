'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Upload, Search, FileText, Mic, Languages } from 'lucide-react'
import { cn } from '@/app/lib/utils'

const routes = [
  {
    label: 'PDF Summarizer',
    icon: <Upload className="mr-2 h-4 w-4" />,
    href: '/pdf',
  },
  {
    label: 'Web Scraper',
    icon: <Search className="mr-2 h-4 w-4" />,
    href: '/web-scrape',
  },
  {
    label: 'Text Summarizer',
    icon: <FileText className="mr-2 h-4 w-4" />,
    href: '/text-summarize',
  },
  {
    label: 'Audio Summarizer',
    icon: <Mic className="mr-2 h-4 w-4" />,
    href: '/audio-summarize',
  },
  {
    label: 'Translator',
    icon: <Languages className="mr-2 h-4 w-4" />,
    href: '/translate',
  },
]

export function Navigation({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'flex items-center text-sm font-medium transition-colors hover:text-primary',
            pathname === route.href
              ? 'text-primary'
              : 'text-muted-foreground',
          )}
        >
          {route.icon}
          {route.label}
        </Link>
      ))}
    </nav>
  )
} 