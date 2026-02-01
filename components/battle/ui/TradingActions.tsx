'use client'

import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Pause } from 'lucide-react'
import { useGameStore } from '@/lib/stores/useGameStore'
import { useMemo } from 'react'

interface TradingActionsProps {
  positionId: string | null
  onAction?: (action: 'sell' | 'buy' | 'hold') => void
}

export function TradingActions({ positionId, onAction }: TradingActionsProps) {
  const portfolio = useGameStore(state => state.portfolioAssets)
  const realizedProfit = useGameStore(state => state.realizedProfit)
  const dailyCapitalInflow = useGameStore(state => state.dailyCapitalInflow)
  const sellPosition = useGameStore(state => state.sellPosition)
  const buyMore = useGameStore(state => state.buyMore)

  const position = useMemo(() => {
    if (!positionId) return null
    return portfolio.find(p => p.id === positionId)
  }, [portfolio, positionId])

  const profit = useMemo(() => {
    if (!position) return 0
    return ((position.currentPrice - position.buyPrice) / position.buyPrice) * 100
  }, [position])

  const profitAmount = useMemo(() => {
    if (!position) return 0
    return (position.currentPrice - position.buyPrice) * position.quantity
  }, [position])

  const canBuyMore = useMemo(() => {
    if (!position) return false
    const additionalCost = position.currentPrice * 10 // Buy 10 more shares
    return realizedProfit >= additionalCost
  }, [position, realizedProfit])

  const handleSell = () => {
    if (!positionId) return
    sellPosition(positionId)
    onAction?.('sell')
  }

  const handleBuyMore = () => {
    if (!position || !canBuyMore) return
    const additionalQuantity = 10 // Fixed amount for now
    buyMore(positionId!, additionalQuantity)
    onAction?.('buy')
  }

  const handleHold = () => {
    onAction?.('hold')
  }

  if (!position) {
    return (
      <div className="p-4 bg-card/10 border border-primary/10 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          Select a position to view trading actions
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-card/10 border border-primary/10 rounded-lg space-y-4">
      {/* Position Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{position.symbol}</span>
          <span
            className={`text-sm font-bold ${
              profit >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {profit >= 0 ? '+' : ''}
            {profit.toFixed(2)}%
          </span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Buy Price: ${position.buyPrice.toFixed(2)}</div>
          <div>Current Price: ${position.currentPrice.toFixed(2)}</div>
          <div>Quantity: {position.quantity}</div>
          <div>
            Profit:{' '}
            <span className={profitAmount >= 0 ? 'text-green-500' : 'text-red-500'}>
              ${profitAmount >= 0 ? '+' : ''}
              {profitAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSell}
          variant="destructive"
          className="flex-1"
          size="sm"
        >
          <TrendingDown className="w-4 h-4 mr-1" />
          Sell
        </Button>
        <Button
          onClick={handleBuyMore}
          variant="default"
          className="flex-1"
          size="sm"
          disabled={!canBuyMore}
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          Buy More
        </Button>
        <Button
          onClick={handleHold}
          variant="outline"
          className="flex-1"
          size="sm"
        >
          <Pause className="w-4 h-4 mr-1" />
          Hold
        </Button>
      </div>

      {/* Available Capital */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t border-primary/10">
        <div>Available: ${realizedProfit.toFixed(2)}</div>
        <div>Daily Inflow: +${dailyCapitalInflow.toFixed(2)}</div>
      </div>
    </div>
  )
}
