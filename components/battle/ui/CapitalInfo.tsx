'use client'

import { useMemo } from 'react'
import { useGameStore } from '@/lib/stores/useGameStore'
import { TrendingUp, DollarSign } from 'lucide-react'

export function CapitalInfo() {
  const aum = useGameStore(state => state.aum) || 0
  const totalAssets = useGameStore(state => state.totalAssets)
  const calculatePortfolioReturn = useGameStore(state => state.calculatePortfolioReturn)
  
  // Calculate total profit (totalAssets - aum)
  const totalProfit = useMemo(() => {
    return totalAssets - aum
  }, [totalAssets, aum])
  
  // Calculate portfolio return percentage
  const portfolioReturn = useMemo(() => {
    return calculatePortfolioReturn()
  }, [calculatePortfolioReturn, totalAssets, aum])
  
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-card/50 border-b border-primary/10">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Total Profit</span>
          <span className={`text-sm font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <TrendingUp className={`h-4 w-4 ${portfolioReturn >= 0 ? 'text-green-500' : 'text-red-500'}`} />
        <div className="flex flex-col text-right">
          <span className="text-xs text-muted-foreground">Return</span>
          <span className={`text-sm font-bold ${portfolioReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}
