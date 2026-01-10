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

          <div className="text-white mb-2 text-lg">TERMS OF SERVICE</div>
          <div className="text-gray-500 mb-6 text-sm">Last Updated: January 2026</div>

          <div className="text-gray-600 mb-6">{'-'.repeat(50)}</div>

          {/* Risk Warning Box */}
          <div className="mb-6 p-4 border border-red-800 bg-red-950/30">
            <div className="text-red-400 font-bold mb-2">RISK WARNING</div>
            <div className="text-red-300/80 text-sm">
              Cryptoassets are high-risk. You may lose all money you use. This website is not authorised or regulated by the Financial Conduct Authority (FCA).
            </div>
          </div>

          {/* Terms Content */}
          <div className="space-y-6 text-gray-400 text-sm">

            <section>
              <div className="text-gray-300 font-bold mb-2">1. ABOUT THIS WEBSITE</div>
              <div className="space-y-2 text-gray-500">
                <p>1.1 CthuCoin is an experimental decentralised exchange (DEX) operated as a hobby project by an individual developer.</p>
                <p>1.2 This website is NOT authorised or regulated by the Financial Conduct Authority (FCA) or any other financial regulatory body.</p>
                <p>1.3 Nothing on this website constitutes financial, legal, or tax advice.</p>
                <p>1.4 This is experimental software. Smart contracts may contain bugs. Use at your own risk.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">2. ELIGIBILITY</div>
              <div className="space-y-2 text-gray-500">
                <p>2.1 You must be at least 18 years old to use this website.</p>
                <p>2.2 You must not be a resident of any jurisdiction where cryptoasset services are prohibited.</p>
                <p>2.3 You are responsible for ensuring your use complies with all applicable laws.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">3. UK RESIDENTS</div>
              <div className="space-y-2 text-gray-500">
                <p>3.1 This website is not intended for residents of the United Kingdom.</p>
                <p>3.2 The promotions on this website have not been approved by an FCA-authorised person.</p>
                <p>3.3 UK residents use this website at their own risk and acknowledge the lack of FCA regulatory protection.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">4. RISK ACKNOWLEDGMENT</div>
              <div className="space-y-2 text-gray-500">
                <p>4.1 The value of cryptoassets can go down as well as up.</p>
                <p>4.2 You may lose all the crypto you use.</p>
                <p>4.3 You should not use crypto you cannot afford to lose.</p>
                <p>4.4 Cryptoassets are not protected by the Financial Services Compensation Scheme (FSCS).</p>
                <p>4.5 Cryptoassets are not covered by the Financial Ombudsman Service (FOS).</p>
                <p>4.6 Past performance is not a reliable indicator of future results.</p>
                <p>4.7 Smart contracts may contain vulnerabilities or bugs that could result in loss of funds.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">5. USER RESPONSIBILITIES</div>
              <div className="space-y-2 text-gray-500">
                <p>5.1 You are solely responsible for the security of your wallet and private keys.</p>
                <p>5.2 You are responsible for any taxes arising from your use of this website.</p>
                <p>5.3 You must conduct your own research before making any transactions.</p>
                <p>5.4 You must not use this website for any unlawful purpose.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">6. NO WARRANTIES</div>
              <div className="space-y-2 text-gray-500">
                <p>6.1 This website is provided &quot;as is&quot; without any warranties of any kind.</p>
                <p>6.2 We do not guarantee the website will be available, uninterrupted, or error-free.</p>
                <p>6.3 We do not guarantee the accuracy of any information on this website.</p>
                <p>6.4 We do not guarantee that smart contracts will function as intended.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">7. LIMITATION OF LIABILITY</div>
              <div className="space-y-2 text-gray-500">
                <p>7.1 To the maximum extent permitted by law, we shall not be liable for any losses arising from your use of this website.</p>
                <p>7.2 This includes loss of profits, loss of data, loss of cryptoassets, and any indirect or consequential losses.</p>
                <p>7.3 We are not liable for any losses caused by smart contract bugs, hacks, or exploits.</p>
              </div>
            </section>

            <section>
              <div className="text-gray-300 font-bold mb-2">8. GOVERNING LAW</div>
              <div className="space-y-2 text-gray-500">
                <p>8.1 These terms shall be governed by the laws of England and Wales.</p>
                <p>8.2 Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
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
            <span className="text-gray-500">terms@cthu-os:~$</span> <BlinkingCursor />
          </div>
        </div>
      </div>
    </div>
  )
}
