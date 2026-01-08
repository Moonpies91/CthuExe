'use client'

import { CRTEffects } from './CRTEffects'
import { useSanityMode } from '@/hooks/useSanityMode'
import { useGlitchLevel } from '@/hooks/useGlitchLevel'

interface CRTWrapperProps {
  children: React.ReactNode
}

export function CRTWrapper({ children }: CRTWrapperProps) {
  const { sanityMode } = useSanityMode()
  const { madnessLevel } = useGlitchLevel()

  // Visible but not overpowering effects - adjust based on madness level
  const aberrationIntensity = sanityMode ? 2 : 4 + (madnessLevel * 1.5)
  const scanlineOpacity = sanityMode ? 0.1 : 0.2 + (madnessLevel * 0.03)

  return (
    <>
      <CRTEffects
        enabled={true}
        aberrationIntensity={aberrationIntensity}
        scanlineOpacity={Math.min(scanlineOpacity, 0.6)} // Cap at 0.6 so it's not too dark
      />
      {children}
    </>
  )
}
