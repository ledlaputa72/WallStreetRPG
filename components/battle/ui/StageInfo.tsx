'use client'

import { useGameStore } from '@/lib/stores/useGameStore'

interface StageInfoProps {
  stage: string
  currentWave: number
  maxWave: number
  profitPercent: string
  currentPrice: number
  targetPrice?: number
  resistancePrice?: number
  symbol?: string
  stockName?: string
  year?: number
  currentDate?: string // Current candle date
}

export function StageInfo({ 
  stage, 
  currentWave, 
  maxWave, 
  profitPercent, 
  currentPrice,
  targetPrice,
  resistancePrice,
  symbol = 'AAPL',
  stockName,
  year,
  currentDate,
}: StageInfoProps) {
  const realizedProfit = useGameStore(state => state.realizedProfit)
  const dailyCapitalInflow = useGameStore(state => state.dailyCapitalInflow)
  const currentDayIndex = useGameStore(state => state.currentDayIndex)
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="flex items-center justify-between gap-3 sm:gap-4 w-full flex-nowrap min-w-0 overflow-hidden text-xs sm:text-sm">
      {/* Portfolio & Year */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="font-bold text-foreground">Portfolio</span>
        {year != null && (
          <span className="text-muted-foreground">· {year}</span>
        )}
      </div>

      {/* SDay */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-muted-foreground">SDay</span>
        <span className="font-semibold">{currentDayIndex}/252</span>
      </div>

      {/* Cash Balance */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-muted-foreground">Cash balance:</span>
        <span className="font-semibold">{formatCurrency(realizedProfit)}</span>
      </div>

      {/* Daily Funding */}
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <span className="text-muted-foreground">Daily funding:</span>
        <span className="font-semibold">{formatCurrency(dailyCapitalInflow)}</span>
      </div>
    </div>
  )
}
