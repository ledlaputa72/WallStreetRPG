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
      {/* Desktop: 1 row x 4 columns */}
      <div className="hidden md:grid md:grid-cols-4 divide-x divide-primary/10">
        {dashboardItems.map((item, index) => (
          <div
            key={`item-${index}`}
            className="px-3 py-2.5 text-center"
          >
            <div className="text-[10px] text-muted-foreground font-medium mb-1">
              {item.label}
            </div>
            <div className={`text-sm md:text-base font-bold ${item.color}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
      
      {/* Mobile: 2 rows x 2 columns */}
      <div className="md:hidden">
        {/* First row: 2 columns */}
        <div className="grid grid-cols-2 divide-x divide-primary/10 border-b border-primary/10">
          {dashboardItems.slice(0, 2).map((item, index) => (
            <div key={`mobile-${index}`} className="px-2 py-1.5 text-center">
              <div className="text-[9px] text-muted-foreground font-medium mb-0.5">
                {item.label}
              </div>
              <div className={`text-xs font-bold ${item.color}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        
        {/* Second row: 2 columns */}
        <div className="grid grid-cols-2 divide-x divide-primary/10">
          {dashboardItems.slice(2, 4).map((item, index) => (
            <div key={`mobile-${index + 2}`} className="px-2 py-1.5 text-center">
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
