import { defineChain } from 'viem'

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MONAD',
    symbol: 'MONAD',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet-explorer.monad.xyz' },
  },
  testnet: true,
})

export const monadMainnet = defineChain({
  id: 10142,
  name: 'Monad',
  nativeCurrency: {
    decimals: 18,
    name: 'MONAD',
    symbol: 'MONAD',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://mainnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
  testnet: false,
})
