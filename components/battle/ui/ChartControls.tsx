'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChartType, CandleCount, SpeedMultiplier, GameState } from '../types'

interface ChartControlsProps {
  gameState: GameState
  chartType: ChartType
  candleCount: CandleCount
  speedMultiplier: SpeedMultiplier
  onStartStop: () => void
  onChartTypeChange: (type: ChartType) => void
  onCandleCountChange: (count: CandleCount) => void
  onSpeedChange: (speed: SpeedMultiplier) => void
}

export function ChartControls({
  gameState,
  chartType,
  candleCount,
  speedMultiplier,
  onStartStop,
  onChartTypeChange,
  onCandleCountChange,
  onSpeedChange,
}: ChartControlsProps) {
  const chartTypes: ChartType[] = ['area', 'candle', 'line']
  const candleCounts: CandleCount[] = [20, 30, 40]
  const speeds: SpeedMultiplier[] = [1, 2, 3, 4, 5]

  // 차트 타입 순환
  const cycleChartType = () => {
    const currentIndex = chartTypes.indexOf(chartType)
    const nextIndex = (currentIndex + 1) % chartTypes.length
    onChartTypeChange(chartTypes[nextIndex])
  }

  // 캔들 개수 순환
  const cycleCandleCount = () => {
    const currentIndex = candleCounts.indexOf(candleCount)
    const nextIndex = (currentIndex + 1) % candleCounts.length
    onCandleCountChange(candleCounts[nextIndex])
  }

  // 속도 순환
  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(speedMultiplier)
    const nextIndex = (currentIndex + 1) % speeds.length
    onSpeedChange(speeds[nextIndex])
  }

  // 차트 타입 라벨
  const getChartTypeLabel = (type: ChartType) => {
    const labels: Record<ChartType, string> = {
      area: 'Area',
      candle: 'Candle',
      line: 'Line',
    }
    return labels[type]
  }

  // Get button label based on game state
  const getStartStopLabel = () => {
    if (gameState === 'LOADING') return 'Loading...'
    if (gameState === 'PLAYING') return 'Stop'
    return 'Start'
  }

  // Get button color based on game state
  const getStartStopColor = () => {
    if (gameState === 'LOADING') return 'bg-gray-500 hover:bg-gray-600'
    if (gameState === 'PLAYING') return 'bg-red-500 hover:bg-red-600'
    return 'bg-green-500 hover:bg-green-600'
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-nowrap overflow-x-auto pb-1 scrollbar-thin">
      <Button
        variant="default"
        size="sm"
        onClick={onStartStop}
        disabled={gameState === 'LOADING'}
        className={cn("h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium text-white border-0 shrink-0", getStartStopColor())}
      >
        {getStartStopLabel()}
      </Button>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-orange-500 font-medium hidden sm:inline">차트타입</span>
        <Button variant="default" size="sm" onClick={cycleChartType} className="h-8 sm:h-9 px-3 text-xs sm:text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white border-0 shrink-0">
          {getChartTypeLabel(chartType)}
        </Button>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-purple-500 font-medium hidden sm:inline">캔들개수</span>
        <Button variant="default" size="sm" onClick={cycleCandleCount} className="h-8 sm:h-9 px-3 text-xs sm:text-sm font-medium bg-purple-500 hover:bg-purple-600 text-white border-0 shrink-0">
          {candleCount}x
        </Button>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-blue-500 font-medium hidden sm:inline">속도</span>
        <Button variant="default" size="sm" onClick={cycleSpeed} className="h-8 sm:h-9 px-3 text-xs sm:text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white border-0 shrink-0">
          x{speedMultiplier}
        </Button>
      </div>
    </div>
  )
}
