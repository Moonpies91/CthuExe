// Contract addresses - update after deployment
export const CONTRACTS = {
  // Testnet addresses (Chain ID: 10143)
  testnet: {
    CTHUCOIN: process.env.NEXT_PUBLIC_CTHUCOIN_ADDRESS || '',
    FACTORY: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '',
    ROUTER: process.env.NEXT_PUBLIC_ROUTER_ADDRESS || '',
    FARM: process.env.NEXT_PUBLIC_FARM_ADDRESS || '',
    LAUNCHPAD: process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS || '',
    LEADERBOARD: process.env.NEXT_PUBLIC_LEADERBOARD_ADDRESS || '',
    WMONAD: process.env.NEXT_PUBLIC_WMONAD_ADDRESS || '',
  },
  // Mainnet addresses (Chain ID: 10142)
  mainnet: {
    CTHUCOIN: '',
    FACTORY: '',
    ROUTER: '',
    FARM: '',
    LAUNCHPAD: '',
    LEADERBOARD: '',
    WMONAD: '',
  },
}

export const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD'

// Get contracts for current chain
export function getContracts(chainId: number) {
  if (chainId === 10143) return CONTRACTS.testnet
  if (chainId === 10142) return CONTRACTS.mainnet
  return CONTRACTS.testnet // Default to testnet
}
