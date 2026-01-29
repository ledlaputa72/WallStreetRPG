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
    <div className="flex items-center justify-between gap-3">
      {/* Chart Type - 오렌지 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-orange-500 font-medium">차트타입</span>
        <Button
          variant="default"
          size="sm"
          onClick={cycleChartType}
          className="h-7 px-3 text-xs bg-orange-500 hover:bg-orange-600 text-white border-0"
        >
          {getChartTypeLabel(chartType)}
        </Button>
      </div>

      {/* Candle Count - 퍼플 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-purple-500 font-medium">캔들개수</span>
        <Button
          variant="default"
          size="sm"
          onClick={cycleCandleCount}
          className="h-7 px-3 text-xs bg-purple-500 hover:bg-purple-600 text-white border-0"
        >
          {candleCount}x
        </Button>
      </div>

      {/* Speed - 블루 */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-blue-500 font-medium">속도</span>
        <Button
          variant="default"
          size="sm"
          onClick={cycleSpeed}
          className="h-7 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white border-0"
        >
          x{speedMultiplier}
        </Button>
      </div>
    </div>
  )
}
