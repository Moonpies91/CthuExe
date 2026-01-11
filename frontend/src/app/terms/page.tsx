'use client'

import Link from 'next/link'
import { Scanlines } from '@/components/terminal/Scanlines'
import { GlitchOverlay } from '@/components/terminal/GlitchOverlay'
import { BlinkingCursor } from '@/components/terminal/BlinkingCursor'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'
import { useSanityMode } from '@/hooks/useSanityMode'

export default function TermsPage() {
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

          <div className="text-white mb-2 text-lg">TERMS OF USE</div>
          <div className="text-gray-500 mb-6 text-sm">Last Updated: January 2026</div>

          <div className="text-gray-600 mb-6">{'-'.repeat(50)}</div>

          {/* Info Box */}
          <div className="mb-6 p-4 border border-blue-800 bg-blue-950/30">
            <div className="text-blue-400 font-bold mb-2">INFORMATION DISPLAY</div>
            <div className="text-blue-300/80 text-sm">
              This website is an information-only display. No transactions, trades, or
              financial activities can be conducted through this interface.
            </div>
          </div>

          {/* Terms Content */}
          <div className="space-y-6 text-gray-400 text-sm">

            <section>
              <div className="text-gray-300 font-bold mb-2">1. ABOUT THIS WEBSITE</div>
              <div className="space-y-2 text-gray-500">
                <p>1.1 This website displays information about an experimental blockchain project operated as a hobby by an individual developer.</p>
                <p>1.2 This website is an information-only display. It does not facilitate any transactions, trades, swaps, or financial activities.</p>
                <p>1.3 The website reads and displays publicly available blockchain data.</p>
                <p>1.4 Nothing on this website constitutes financial, legal, or investment advice.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">2. INFORMATION DISPLAY ONLY</div>
              <div className="space-y-2 text-gray-500">
                <p>2.1 This website displays blockchain data for informational purposes only.</p>
                <p>2.2 No wallet connection is required or requested.</p>
                <p>2.3 No transactions can be initiated through this website.</p>
                <p>2.4 Users cannot buy, sell, trade, stake, or perform any financial transactions through this interface.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">3. EXPERIMENTAL PROJECT</div>
              <div className="space-y-2 text-gray-500">
                <p>3.1 This is an experimental hobby project created for educational purposes.</p>
                <p>3.2 The smart contracts displayed are experimental and may contain bugs.</p>
                <p>3.3 This project is not intended for commercial use.</p>
                <p>3.4 The developer makes no representations about the reliability or accuracy of the displayed information.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">4. NO FINANCIAL ADVICE</div>
              <div className="space-y-2 text-gray-500">
                <p>4.1 Nothing on this website should be construed as financial, investment, or legal advice.</p>
                <p>4.2 This website does not promote, recommend, or endorse any financial activities.</p>
                <p>4.3 Any decisions you make regarding cryptocurrency are your sole responsibility.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">5. THIRD-PARTY BLOCKCHAIN DATA</div>
              <div className="space-y-2 text-gray-500">
                <p>5.1 This website reads data from public blockchain networks.</p>
                <p>5.2 Blockchain data is provided by third-party networks and may be delayed or inaccurate.</p>
                <p>5.3 We are not responsible for any errors in blockchain data display.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">6. NO WARRANTIES</div>
              <div className="space-y-2 text-gray-500">
                <p>6.1 This website is provided &quot;as is&quot; without any warranties of any kind.</p>
                <p>6.2 We do not guarantee the website will be available, uninterrupted, or error-free.</p>
                <p>6.3 We do not guarantee the accuracy of any information displayed.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">7. LIMITATION OF LIABILITY</div>
              <div className="space-y-2 text-gray-500">
                <p>7.1 To the maximum extent permitted by law, we shall not be liable for any losses arising from your use of this website.</p>
                <p>7.2 This includes any reliance on information displayed on this website.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">8. INTELLECTUAL PROPERTY</div>
              <div className="space-y-2 text-gray-500">
                <p>8.1 The visual design and code of this website are the property of the developer.</p>
                <p>8.2 Smart contract code is open source and available for review.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">9. CHANGES TO TERMS</div>
              <div className="space-y-2 text-gray-500">
                <p>9.1 We may modify these terms at any time without prior notice.</p>
                <p>9.2 Continued use of the website after changes constitutes acceptance of the new terms.</p>
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
