'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'

const NAV_ITEMS = [
  { href: '/', label: 'HOME' },
  { href: '/swap', label: 'SWAP' },
  { href: '/liquidity', label: 'LIQUIDITY' },
  { href: '/farm', label: 'FARM' },
  { href: '/launchpad', label: 'LAUNCHPAD' },
  { href: '/leaderboard', label: 'LEADERBOARD' },
]

export function Navigation() {
  const pathname = usePathname()
  const { madnessLevel, madnessName } = useGlitchLevel()

  return (
    <nav className="border-b border-gray-800 bg-cthu-dark/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-cthu-green font-bold text-xl group-hover:animate-glitch">
              CTHUCOIN
            </span>
            <span className="text-gray-500 text-xs hidden sm:inline">
              v0.6.6.6
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-sm transition-colors ${
                  pathname === item.href
                    ? 'text-cthu-green border-b-2 border-cthu-green'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Madness Level */}
            <div className="hidden sm:flex flex-col items-end text-xs">
              <span className="text-gray-500">MADNESS</span>
              <span className={`font-bold ${
                madnessLevel >= 4 ? 'text-cthu-purple animate-pulse' :
                madnessLevel >= 2 ? 'text-cthu-cyan' :
                'text-cthu-green'
              }`}>
                LVL {madnessLevel} - {madnessName}
              </span>
            </div>

            {/* Wallet Connect */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted
                const connected = ready && account && chain

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="terminal-button text-sm"
                          >
                            CONNECT
                          </button>
                        )
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="terminal-button text-sm border-red-500 text-red-500"
                          >
                            WRONG NETWORK
                          </button>
                        )
                      }

                      return (
                        <button
                          onClick={openAccountModal}
                          className="terminal-button text-sm"
                        >
                          {account.displayName}
                        </button>
                      )
                    })()}
                  </div>
                )
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-gray-800 overflow-x-auto">
        <div className="flex px-2 py-2 gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1 text-xs whitespace-nowrap ${
                pathname === item.href
                  ? 'text-cthu-green bg-cthu-green/10'
                  : 'text-gray-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
