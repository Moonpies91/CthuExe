'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { href: '/', label: 'HOME', key: 'H' },
  { href: '/swap', label: 'SWAP', key: 'S' },
  { href: '/liquidity', label: 'LIQ', key: 'L' },
  { href: '/farm', label: 'FARM', key: 'F' },
  { href: '/launchpad', label: 'LAUNCH', key: 'P' },
  { href: '/leaderboard', label: 'RANKS', key: 'R' },
  { href: '/roadmap', label: 'ROADMAP', key: 'M' },
]

export function Navigation() {
  const pathname = usePathname()
  const { madnessLevel } = useGlitchLevel()
  const [blockNumber, setBlockNumber] = useState('--------')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Simulate block number updates
    const interval = setInterval(() => {
      setBlockNumber(Math.floor(Math.random() * 90000000 + 10000000).toString())
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  return (
    <nav className="border-b border-gray-800 bg-black sticky top-0 z-40 font-mono">
      {/* Top bar - System info */}
      <div className="border-b border-gray-800 px-4 py-1 flex justify-between text-xs text-gray-600">
        <div className="flex gap-4">
          <span>CTHU-OS v0.6.6.6</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">MONAD MAINNET</span>
        </div>
        <div className="flex gap-4">
          <span className="hidden sm:inline">BLOCK: {mounted ? blockNumber : '--------'}</span>
          <span>|</span>
          <span className={madnessLevel >= 3 ? 'animate-pulse text-white' : ''}>
            MADNESS: [{madnessLevel}/5]
          </span>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-white font-bold tracking-wider group-hover:text-gray-300">
              ┌─ CTHU.EXE ─┐
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center">
            <span className="text-gray-600 mr-2">│</span>
            {NAV_ITEMS.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 text-sm transition-all ${
                  pathname === item.href
                    ? 'text-black bg-white'
                    : 'text-gray-500 hover:text-white hover:bg-gray-900'
                }`}
              >
                [{item.key}] {item.label}
              </Link>
            ))}
            <span className="text-gray-600 ml-2">│</span>
          </div>

          {/* Wallet Connect */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted: walletMounted,
            }) => {
              const ready = walletMounted
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
                          className="text-sm border border-gray-600 px-3 py-1 text-gray-400 hover:text-white hover:border-white transition-all"
                        >
                          ┌ CONNECT ┐
                        </button>
                      )
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          className="text-sm border border-white px-3 py-1 text-white animate-pulse"
                        >
                          !! WRONG CHAIN !!
                        </button>
                      )
                    }

                    return (
                      <button
                        onClick={openAccountModal}
                        className="text-sm border border-gray-600 px-3 py-1 text-gray-400 hover:text-white hover:border-white transition-all"
                      >
                        └ {account.displayName} ┘
                      </button>
                    )
                  })()}
                </div>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-gray-800 overflow-x-auto">
        <div className="flex px-2 py-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1 text-xs whitespace-nowrap ${
                pathname === item.href
                  ? 'text-black bg-white'
                  : 'text-gray-500'
              }`}
            >
              [{item.key}]
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
