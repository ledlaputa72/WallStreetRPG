'use client'

import { useMemo } from 'react'
import { useGameStore } from '@/lib/stores/useGameStore'

export function CapitalInfo() {
  const aum = useGameStore(state => state.aum) || 0
  const totalAssets = useGameStore(state => state.totalAssets)
  const realizedProfit = useGameStore(state => state.realizedProfit)
  const dailyCapitalInflow = useGameStore(state => state.dailyCapitalInflow)
  const calculatePortfolioReturn = useGameStore(state => state.calculatePortfolioReturn)
  
  // Calculate values
  const totalProfit = useMemo(() => {
    return totalAssets - aum
  }, [totalAssets, aum])
  
  const profitPercentage = useMemo(() => {
    if (aum === 0) return 0
    return ((totalAssets - aum) / aum) * 100
  }, [totalAssets, aum])
  
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
  
  // Dashboard items
  const dashboardItems = [
    {
      label: 'Initial AUM',
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
    {
      label: 'Cash Balance',
      value: formatCurrency(realizedProfit),
      color: 'text-foreground',
    },
    {
      label: 'Daily Funding',
      value: formatCurrency(dailyCapitalInflow),
      color: 'text-foreground',
    },
  ]
  
  return (
    <div className="bg-card/50 border-b border-primary/10">
      {/* Desktop: 2 rows x 6 columns */}
      <div className="hidden md:grid md:grid-cols-6 divide-x divide-primary/10">
        {/* Row 1: Labels */}
        <div className="grid grid-cols-6 col-span-6 divide-x divide-primary/10">
          {dashboardItems.map((item, index) => (
            <div
              key={`label-${index}`}
              className="px-3 py-2 text-center border-b border-primary/10"
            >
              <span className="text-[10px] text-muted-foreground font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Row 2: Values */}
        <div className="grid grid-cols-6 col-span-6 divide-x divide-primary/10">
          {dashboardItems.map((item, index) => (
            <div
              key={`value-${index}`}
              className="px-3 py-2.5 text-center"
            >
              <span className={`text-sm md:text-base font-bold ${item.color}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Mobile: 3 columns x 2 rows (2 layers) */}
      <div className="md:hidden">
        {/* First layer: 3 columns */}
        <div className="grid grid-cols-3 divide-x divide-primary/10 border-b border-primary/10">
          {dashboardItems.slice(0, 3).map((item, index) => (
            <div key={`mobile-label-${index}`} className="px-2 py-1.5 text-center">
              <div className="text-[9px] text-muted-foreground font-medium mb-0.5">
                {item.label}
              </div>
              <div className={`text-xs font-bold ${item.color}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        
        {/* Second layer: 3 columns */}
        <div className="grid grid-cols-3 divide-x divide-primary/10">
          {dashboardItems.slice(3, 6).map((item, index) => (
            <div key={`mobile-label-${index + 3}`} className="px-2 py-1.5 text-center">
              <div className="text-[9px] text-muted-foreground font-medium mb-0.5">
                {item.label}
              </div>
              <div className={`text-xs font-bold ${item.color}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
