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
                <p>This Privacy Policy explains how CthuCoin collects, uses, and protects your data when you use our website.</p>
                <p>This website is operated by an individual developer as a hobby project.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">2. DATA WE COLLECT</div>
              <div className="space-y-2 text-gray-500">
                <p><strong>2.1 Blockchain Data</strong></p>
                <p>- Wallet addresses (publicly visible on blockchain)</p>
                <p>- Transaction history (publicly visible on blockchain)</p>
                <p className="text-gray-600 italic">Note: Blockchain data is inherently public and immutable. We cannot delete data recorded on the blockchain.</p>
                
                <p className="mt-3"><strong>2.2 Technical Data</strong></p>
                <p>- Wallet signatures for authentication</p>
                <p>- Session tokens (stored locally in your browser)</p>
                
                <p className="mt-3"><strong>2.3 What We Do NOT Collect</strong></p>
                <p>- Personal identification information</p>
                <p>- Email addresses</p>
                <p>- Names or physical addresses</p>
                <p>- Analytics or tracking data</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">3. HOW WE USE YOUR DATA</div>
              <div className="space-y-2 text-gray-500">
                <p>We use blockchain data to:</p>
                <p>- Display your wallet balance and transaction history</p>
                <p>- Process transactions you initiate</p>
                <p>- Show your staking positions and rewards</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">4. THIRD-PARTY SERVICES</div>
              <div className="space-y-2 text-gray-500">
                <p>This website interacts with:</p>
                <p>- <strong>Monad Blockchain:</strong> All transactions are recorded on the public blockchain</p>
                <p>- <strong>WalletConnect/RainbowKit:</strong> For wallet connections</p>
                <p>- <strong>GitHub Pages:</strong> Website hosting</p>
                <p>Each service has its own privacy policy which you should review.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2" id="cookies">5. COOKIES</div>
              <div className="space-y-2 text-gray-500">
                <p><strong>5.1 Essential Cookies</strong></p>
                <p>We use minimal essential cookies/local storage for:</p>
                <p>- Wallet connection state</p>
                <p>- User preferences (theme, dismissed warnings)</p>
                
                <p className="mt-3"><strong>5.2 No Tracking Cookies</strong></p>
                <p>We do not use analytics, advertising, or tracking cookies.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">6. YOUR RIGHTS (UK GDPR)</div>
              <div className="space-y-2 text-gray-500">
                <p>Under UK data protection law, you have the right to:</p>
                <p>- Access your personal data</p>
                <p>- Rectify inaccurate data</p>
                <p>- Request erasure of data (where applicable)</p>
                <p>- Object to processing</p>
                <p>- Data portability</p>
                <p className="text-gray-600 italic mt-2">Note: Blockchain data cannot be modified or deleted due to its immutable nature.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">7. DATA RETENTION</div>
              <div className="space-y-2 text-gray-500">
                <p>- Local storage data: Until you clear your browser data</p>
                <p>- Blockchain data: Permanently (immutable)</p>
                <p>- We do not maintain any off-chain database of user information</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">8. SECURITY</div>
              <div className="space-y-2 text-gray-500">
                <p>- All connections use HTTPS encryption</p>
                <p>- We never have access to your private keys</p>
                <p>- Smart contracts are open source and auditable</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">9. CHANGES TO THIS POLICY</div>
              <div className="space-y-2 text-gray-500">
                <p>We may update this policy from time to time. Changes will be posted on this page with an updated revision date.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">10. CONTACT</div>
              <div className="space-y-2 text-gray-500">
                <p>For privacy-related questions, please raise an issue on our GitHub repository.</p>
              </div>
            </section>

          </div>

          <div className="text-gray-600 my-6">{'-'.repeat(50)}</div>

          <div className="mt-6 pt-4 border-t border-gray-800">
            <span className="text-gray-500">privacy@cthu-os:~$</span> <BlinkingCursor />
          </div>
        </div>
      </div>
    </div>
  )
}
