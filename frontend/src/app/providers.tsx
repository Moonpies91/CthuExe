'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { useState, type ReactNode } from 'react'
import { config } from '@/config/wagmi'
import { CRTWrapper } from '@/components/terminal/CRTWrapper'
import { PageTransition } from '@/components/terminal/PageTransition'

import '@rainbow-me/rainbowkit/styles.css'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#FFFFFF',
            accentColorForeground: '#000000',
            borderRadius: 'none',
            fontStack: 'system',
          })}
          modalSize="compact"
        >
          <CRTWrapper>
            <PageTransition>
              {children}
            </PageTransition>
          </CRTWrapper>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
