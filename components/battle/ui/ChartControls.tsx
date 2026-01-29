'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChartType, CandleCount, SpeedMultiplier } from '../types'

interface ChartControlsProps {
  chartType: ChartType
  candleCount: CandleCount
  speedMultiplier: SpeedMultiplier
  onChartTypeChange: (type: ChartType) => void
  onCandleCountChange: (count: CandleCount) => void
  onSpeedChange: (speed: SpeedMultiplier) => void
}

export function ChartControls({
  chartType,
  candleCount,
  speedMultiplier,
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

  return (
    <div className="flex items-center justify-between gap-2">
      {/* Chart Type Button - 순환 */}
      <Button
        variant="default"
        size="sm"
        onClick={cycleChartType}
        className="h-7 px-3 text-xs bg-primary text-primary-foreground"
      >
        {getChartTypeLabel(chartType)}
      </Button>

      {/* Candle Count Button - 순환 */}
      <Button
        variant="default"
        size="sm"
        onClick={cycleCandleCount}
        className="h-7 px-3 text-xs bg-primary text-primary-foreground"
      >
        {candleCount}x
      </Button>

      {/* Speed Button - 순환 */}
      <Button
        variant="default"
        size="sm"
        onClick={cycleSpeed}
        className="h-7 px-3 text-xs bg-primary text-primary-foreground flex items-center gap-1"
      >
        <span className="text-[10px] text-primary-foreground/70">Speed:</span>
        <span>x{speedMultiplier}</span>
      </Button>
    </div>
  )
}
