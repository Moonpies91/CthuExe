import type { Metadata } from 'next'
import { Providers } from './providers'
import { DisclaimerBanner } from '@/components/common/DisclaimerBanner'
import { Footer } from '@/components/common/Footer'
import { CookieConsent } from '@/components/common/CookieConsent'
import './globals.css'

export const metadata: Metadata = {
  title: 'CthuCoin - Ph\'nglui mglw\'nafh Cthulhu R\'lyeh wgah\'nagl fhtagn',
  description: 'A Lovecraftian DeFi ecosystem on Monad blockchain. RISK WARNING: Don\'t invest unless you\'re prepared to lose all the money you invest. Not regulated by the FCA.',
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
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  )
}
