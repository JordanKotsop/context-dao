import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/providers/wallet-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'ContextDAO — Cognitive Asset Marketplace',
  description: 'Trade, rent, and optimize high-performance system prompts via x402 payment protocol',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
