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
  const chartTypes: { value: ChartType; label: string }[] = [
    { value: 'area', label: 'Area' },
    { value: 'candle', label: 'Candle' },
    { value: 'line', label: 'Line' },
  ]

  const candleCounts: CandleCount[] = [20, 30, 40]
  const speeds: SpeedMultiplier[] = [1, 2, 3, 4, 5]

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Chart Type Buttons */}
      <div className="flex items-center gap-2">
        {chartTypes.map((type) => (
          <Button
            key={type.value}
            variant={chartType === type.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChartTypeChange(type.value)}
            className={cn(
              'h-7 px-3 text-xs',
              chartType === type.value && 'bg-primary text-primary-foreground'
            )}
          >
            {type.label}
          </Button>
        ))}
      </div>

      {/* Candle Count Buttons */}
      <div className="flex items-center gap-2">
        {candleCounts.map((count) => (
          <Button
            key={count}
            variant={candleCount === count ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCandleCountChange(count)}
            className={cn(
              'h-7 px-3 text-xs',
              candleCount === count && 'bg-primary text-primary-foreground'
            )}
          >
            {count}x
          </Button>
        ))}
      </div>

      {/* Speed Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Speed:</span>
        {speeds.map((speed) => (
          <Button
            key={speed}
            variant={speedMultiplier === speed ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSpeedChange(speed)}
            className={cn(
              'h-7 px-3 text-xs',
              speedMultiplier === speed && 'bg-primary text-primary-foreground'
            )}
          >
            x{speed}
          </Button>
        ))}
      </div>
    </div>
  )
}
