import type { Metadata } from 'next'
import { Providers } from './providers'
import { DisclaimerBanner } from '@/components/common/DisclaimerBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'CthuCoin - Ph\'nglui mglw\'nafh Cthulhu R\'lyeh wgah\'nagl fhtagn',
  description: 'A Lovecraftian DeFi ecosystem on Monad blockchain',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="terminal">
        <Providers>
          <DisclaimerBanner />
          {children}
        </Providers>
      </body>
    </html>
  )
}
