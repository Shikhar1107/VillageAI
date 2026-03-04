import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VillageAI - कृषि मित्र',
  description: 'Voice-first AI agricultural assistant for rural Indian farmers',
  keywords: 'agriculture, farming, AI, voice assistant, rural India, crop advisory',
  authors: [{ name: 'VillageAI Team' }],
  openGraph: {
    title: 'VillageAI - कृषि मित्र',
    description: 'Voice-first AI agricultural assistant for rural Indian farmers',
    type: 'website',
    locale: 'hi_IN',
    alternateLocale: ['en_IN', 'ta_IN', 'mr_IN'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VillageAI - कृषि मित्र',
    description: 'Voice-first AI agricultural assistant for rural Indian farmers',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}