'use client'

import { Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChartType, CandleCount, SpeedMultiplier, GameState } from '../types'

type ChartViewMode = 'portfolio' | 'sp500' | 'stock'

interface ChartControlsProps {
  gameState: GameState
  chartType: ChartType
  candleCount: CandleCount
  speedMultiplier: SpeedMultiplier
  chartMode?: ChartViewMode
  onStartStop: () => void
  onChartTypeChange: (type: ChartType) => void
  onCandleCountChange: (count: CandleCount) => void
  onSpeedChange: (speed: SpeedMultiplier) => void
  onChartModeChange?: (mode: ChartViewMode) => void
}

export function ChartControls({
  gameState,
  chartType,
  candleCount,
  speedMultiplier,
  chartMode = 'portfolio',
  onStartStop,
  onChartTypeChange,
  onCandleCountChange,
  onSpeedChange,
  onChartModeChange,
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

  const secondaryBtnClass = 'h-8 sm:h-9 min-w-[4.5rem] sm:min-w-[5.25rem] px-3 text-xs sm:text-sm font-medium text-white border-0 shrink-0'

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-nowrap overflow-x-auto pb-1 scrollbar-thin">
      {/* 메인 게임: Start 버튼 — 2배 너비, 20% 큰 글자, 플레이/정지 아이콘, 검정 볼드 */}
      <Button
        variant="default"
        size="sm"
        onClick={onStartStop}
        disabled={gameState === 'LOADING'}
        className={cn(
          'h-8 sm:h-9 min-w-[7rem] sm:min-w-[8.5rem] px-5 sm:px-6 text-sm sm:text-base font-bold text-black border-0 shrink-0 flex items-center justify-center gap-1.5',
          getStartStopColor()
        )}
      >
        {gameState === 'PLAYING' ? (
          <Square className="h-4 w-4 shrink-0 fill-current" />
        ) : (
          <Play className="h-4 w-4 shrink-0 fill-current" />
        )}
        {getStartStopLabel()}
      </Button>

      {/* Chart Mode Buttons: Portfolio / S&P 500 */}
      {onChartModeChange && (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={() => onChartModeChange('portfolio')}
            className={cn(
              secondaryBtnClass,
              chartMode === 'portfolio' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'
            )}
          >
            Portfolio
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onChartModeChange('sp500')}
            className={cn(
              secondaryBtnClass,
              chartMode === 'sp500' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'
            )}
          >
            S&P 500
          </Button>
        </div>
      )}

      {/* 오른쪽 정렬: Candle / 20x / x1 — 동일 너비 (Candle 기준) */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
        <Button
          variant="default"
          size="sm"
          onClick={cycleChartType}
          className={cn(secondaryBtnClass, 'bg-orange-500 hover:bg-orange-600')}
        >
          {getChartTypeLabel(chartType)}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={cycleCandleCount}
          className={cn(secondaryBtnClass, 'bg-purple-500 hover:bg-purple-600')}
        >
          {candleCount}x
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={cycleSpeed}
          className={cn(secondaryBtnClass, 'bg-blue-500 hover:bg-blue-600')}
        >
          x{speedMultiplier}
        </Button>
      </div>
    </div>
  )
}
