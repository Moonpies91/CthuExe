'use client'

interface ScanlinesProps {
  madnessLevel: number
  sanityMode: boolean
}

export function Scanlines({ madnessLevel, sanityMode }: ScanlinesProps) {
  // Opacity increases with madness level
  const baseOpacity = 0.02 + madnessLevel * 0.025
  const opacity = sanityMode ? baseOpacity * 0.5 : baseOpacity

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        background: `repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, ${opacity}) 2px,
          rgba(0, 0, 0, ${opacity}) 4px
        )`,
      }}
    />
  )
}
