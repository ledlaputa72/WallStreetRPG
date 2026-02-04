'use client'

import { useMemo } from 'react'
import { useGameStore } from '@/lib/stores/useGameStore'

export function CapitalInfo() {
  const aum = useGameStore(state => state.aum) || 0
  const totalAssets = useGameStore(state => state.totalAssets)
  const dailyCapitalInflow = useGameStore(state => state.dailyCapitalInflow)
  const currentDayIndex = useGameStore(state => state.currentDayIndex)

  // P/L = investment performance only (exclude accumulated daily funding so all-negative stocks => negative P/L)
  // Formula: (Total Assets - Initial AUM) - (daily funding × days elapsed)
  const totalProfit = useMemo(() => {
    const accumulatedFunding = dailyCapitalInflow * currentDayIndex
    return totalAssets - aum - accumulatedFunding
  }, [totalAssets, aum, dailyCapitalInflow, currentDayIndex])

  const profitPercentage = useMemo(() => {
    if (aum === 0) return 0
    return (totalProfit / aum) * 100
  }, [totalProfit, aum])
  
  // Format currency with Intl.NumberFormat
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }
  
  // Dashboard items - 1 row x 4 columns
  const dashboardItems = [
    {
      label: 'AUM',
      value: formatCurrency(aum),
      color: 'text-foreground',
    },
    {
      label: 'Total Assets',
      value: formatCurrency(totalAssets),
      color: 'text-foreground',
    },
    {
      label: 'P&L ($)',
      value: `${totalProfit >= 0 ? '+' : ''}${formatCurrency(Math.abs(totalProfit))}`,
      color: totalProfit >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      label: 'P&L (%)',
      value: formatPercentage(profitPercentage),
      color: profitPercentage >= 0 ? 'text-green-500' : 'text-red-500',
    },
  ]
  
  return (
    <div className="bg-card/50 border-b border-primary/10">
      {/* All screens: 1 row x 4 columns */}
      <div className="grid grid-cols-4 divide-x divide-primary/10">
        {dashboardItems.map((item, index) => (
          <div
            key={`item-${index}`}
            className="px-2 md:px-3 py-1.5 md:py-2.5 text-center"
          >
            <div className="text-[9px] md:text-[10px] text-muted-foreground font-medium mb-0.5 md:mb-1">
              {item.label}
            </div>
            <div className={`text-xs md:text-sm lg:text-base font-bold ${item.color}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
