'use client'

import { useMemo } from 'react'
import { useGameStore } from '@/lib/stores/useGameStore'
import { Wallet, TrendingUp } from 'lucide-react'

export function CapitalInfo() {
  const realizedProfit = useGameStore(state => state.realizedProfit)
  const dailyCapitalInflow = useGameStore(state => state.dailyCapitalInflow)
  const currentDayIndex = useGameStore(state => state.currentDayIndex)
  
  // Calculate available capital
  // realizedProfit already includes dailyCapitalInflow accumulated up to currentDayIndex
  const availableCapital = useMemo(() => {
    return Math.max(0, realizedProfit)
  }, [realizedProfit])
  
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-card/50 border-b border-primary/10">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Available Capital</span>
          <span className="text-sm font-bold">${availableCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Daily Inflow</span>
          <span className="text-sm font-semibold text-green-500">+${dailyCapitalInflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex flex-col text-right">
          <span className="text-xs text-muted-foreground">Total Available</span>
          <span className="text-sm font-bold text-primary">${availableCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  )
}
