'use client'

import Link from 'next/link'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BlinkingCursor } from '@/components/terminal/BlinkingCursor'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'

export default function PrivacyPage() {
  const { madnessLevel } = useGlitchLevel()
  const { sanityMode } = useSanityMode()

  return (
    <div className="min-h-screen bg-black crt-effect">
      <Scanlines madnessLevel={madnessLevel} sanityMode={sanityMode} />
      <GlitchOverlay madnessLevel={madnessLevel} sanityMode={sanityMode} />

      <div className="p-6 font-mono text-base text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-gray-400 mb-1">CTHU-OS v0.6.6.6</div>
          <div className="text-gray-600 mb-4">{'='.repeat(50)}</div>

          <div className="mb-4">
            <Link href="/" className="text-gray-600 hover:text-gray-400">{'<'} BACK TO MAIN</Link>
          </div>

          <div className="text-white mb-2 text-lg">PRIVACY POLICY</div>
          <div className="text-gray-500 mb-6 text-sm">Last Updated: January 2026</div>

          <div className="text-gray-600 mb-6">{'-'.repeat(50)}</div>

          {/* Privacy Content */}
          <div className="space-y-6 text-gray-400 text-sm">

            <section>
              <div className="text-gray-300 font-bold mb-2">1. INTRODUCTION</div>
              <div className="space-y-2 text-gray-500">
                <p>This Privacy Policy explains how this website handles data.</p>
                <p>This is an information-only display operated by an individual developer as a hobby project.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">2. MINIMAL DATA COLLECTION</div>
              <div className="space-y-2 text-gray-500">
                <p>This website is designed to collect minimal data:</p>
                <p className="mt-3"><strong>2.1 What We Do NOT Collect</strong></p>
                <p>- Personal identification information</p>
                <p>- Email addresses</p>
                <p>- Names or physical addresses</p>
                <p>- Wallet addresses (no wallet connection)</p>
                <p>- Analytics or tracking data</p>
                <p>- Transaction history</p>

                <p className="mt-3"><strong>2.2 Technical Data</strong></p>
                <p>- Basic browser preferences (stored locally only)</p>
                <p>- Session preferences (e.g., dismissed notices)</p>
                <p className="text-gray-600 italic">Note: This data is stored in your browser only and not transmitted to any server.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">3. NO WALLET CONNECTION</div>
              <div className="space-y-2 text-gray-500">
                <p>This website does not request or require wallet connections.</p>
                <p>No blockchain transactions can be initiated through this interface.</p>
                <p>We do not have access to any wallet addresses or private keys.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">4. BLOCKCHAIN DATA DISPLAY</div>
              <div className="space-y-2 text-gray-500">
                <p>This website reads publicly available blockchain data to display information.</p>
                <p>This data is publicly available on the blockchain and is not collected by us.</p>
                <p>We use public RPC endpoints to read this data.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2" id="cookies">5. COOKIES AND LOCAL STORAGE</div>
              <div className="space-y-2 text-gray-500">
                <p><strong>5.1 Essential Local Storage</strong></p>
                <p>We use minimal local storage for:</p>
                <p>- User preferences (dismissed banners)</p>
                <p>- Theme preferences</p>

                <p className="mt-3"><strong>5.2 No Tracking</strong></p>
                <p>We do not use analytics, advertising, or tracking cookies.</p>
                <p>We do not use any third-party tracking services.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">6. THIRD-PARTY SERVICES</div>
              <div className="space-y-2 text-gray-500">
                <p>This website may interact with:</p>
                <p>- <strong>Blockchain RPC Providers:</strong> To read public blockchain data</p>
                <p>- <strong>Hosting Provider:</strong> For website delivery</p>
                <p>Each service has its own privacy policy.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">7. DATA RETENTION</div>
              <div className="space-y-2 text-gray-500">
                <p>- Local storage data: Until you clear your browser data</p>
                <p>- We do not maintain any database of user information</p>
                <p>- No data is stored on our servers</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">8. CHANGES TO THIS POLICY</div>
              <div className="space-y-2 text-gray-500">
                <p>We may update this policy from time to time. Changes will be posted on this page with an updated revision date.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">9. CONTACT</div>
              <div className="space-y-2 text-gray-500">
                <p>For privacy-related questions, please raise an issue on our GitHub repository.</p>
              </div>
            </section>

          </div>

          <div className="text-gray-600 my-6">{'-'.repeat(50)}</div>

          <div className="mt-6 pt-4 border-t border-gray-800">
            <span className="text-gray-500">observer@cthu-os:~$</span> <BlinkingCursor />
          </div>
        </div>
      </div>
    </div>
  )
}
