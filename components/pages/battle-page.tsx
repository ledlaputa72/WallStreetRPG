'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { usePhaserGame } from '@/components/battle/hooks/usePhaserGame'
import { StageInfo } from '@/components/battle/ui/StageInfo'
import { ChartControls } from '@/components/battle/ui/ChartControls'
import { QuickInventory } from '@/components/battle/ui/QuickInventory'
import { QuickSkills } from '@/components/battle/ui/QuickSkills'
import { CharacterStats } from '@/components/battle/ui/CharacterStats'
import { mockHero, mockPartners, mockInventory, mockSkills } from '@/components/battle/constants'

// Phaser 컴포넌트를 dynamic import (SSR 비활성화)
const PhaserGame = dynamic(
  () => import('@/components/battle/phaser-game').then(mod => ({ default: mod.PhaserGame })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="space-y-4 w-full p-4">
          <Skeleton className="h-12 w-full bg-slate-800" />
          <Skeleton className="h-64 w-full bg-slate-800" />
          <Skeleton className="h-20 w-full bg-slate-800" />
        </div>
      </div>
    ),
  }
)

export function BattlePage() {
  const stage = '4-12'
  const wave = { current: 1, max: 5 }
  
  const {
    phaserRef,
    phaserReady,
    currentPrice,
    profitPercent,
    chartType,
    candleCount,
    speedMultiplier,
    handleChartTypeChange,
    handleCandleCountChange,
    handleSpeedChange,
  } = usePhaserGame()

  const allCharacters = [mockHero, ...mockPartners]

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      {/* Stock Chart Section - Fixed Height (40% of screen) */}
      <section className="h-[40vh] min-h-[400px] border-b border-primary/20 flex flex-col gap-0 flex-shrink-0">
        {/* Header */}
        <div className="flex-shrink-0 p-3 border-b border-primary/10">
          <StageInfo
            stage={stage}
            currentWave={wave.current}
            maxWave={wave.max}
            profitPercent={profitPercent}
            currentPrice={currentPrice}
          />
        </div>

        {/* Chart Area with Phaser */}
        <div className="flex-1 overflow-hidden relative">
          <PhaserGame ref={phaserRef} currentActiveScene={undefined} />
        </div>

        {/* Chart Controls */}
        <div className="flex-shrink-0 p-3 border-t border-primary/10 bg-card/5">
          <ChartControls
            chartType={chartType}
            candleCount={candleCount}
            speedMultiplier={speedMultiplier}
            onChartTypeChange={handleChartTypeChange}
            onCandleCountChange={handleCandleCountChange}
            onSpeedChange={handleSpeedChange}
          />
        </div>
      </section>

      {/* Bottom Section: Inventory, Skills, Party - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-background">
        <QuickInventory items={mockInventory} />
        <QuickSkills skills={mockSkills} />
        <CharacterStats characters={allCharacters} />
      </div>
    </div>
  )
}
