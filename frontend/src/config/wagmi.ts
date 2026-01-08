'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { monadTestnet, monadMainnet } from './chains'

export const config = getDefaultConfig({
  appName: 'CthuCoin',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [monadMainnet, monadTestnet],
  ssr: true,
})
