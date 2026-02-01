'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/lib/stores/useGameStore'
import { useChartView } from '../hooks/useChartView'
import { SECTOR_COLORS, RARITY_COLORS } from '@/lib/types/stock'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface QuickInventoryProps {
  onStockSelect?: (positionId: string) => void
}

export function QuickInventory({ onStockSelect }: QuickInventoryProps = {}) {
  const [expanded, setExpanded] = useState(true)
  const portfolio = useGameStore(state => state.portfolioAssets)
  const setSelectedPositionId = useGameStore(state => state.setSelectedPositionId)
  const { switchToStock, activeStockId } = useChartView()
  
  const handleCardClick = (positionId: string) => {
    setSelectedPositionId(positionId)
    switchToStock(positionId)
    if (onStockSelect) {
      onStockSelect(positionId)
    }
  }

  // Generate mini chart data for each position (last 20 candles)
  const positionsWithCharts = useMemo(() => {
    return portfolio.map(position => {
      const last20Candles = position.data
        .slice(Math.max(0, position.currentDayIndex - 19), position.currentDayIndex + 1)
        .map((candle, index) => ({
          day: index,
          price: candle.close,
        }))

      const profit = ((position.currentPrice - position.buyPrice) / position.buyPrice) * 100
      const profitAmount = (position.currentPrice - position.buyPrice) * position.quantity

      return {
        ...position,
        chartData: last20Candles,
        profit,
        profitAmount,
      }
    })
  }, [portfolio])

  if (portfolio.length === 0) {
    return (
      <section className="bg-card/10 border-b border-primary/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            Portfolio
          </h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          No positions yet. Select stocks from the draft to build your portfolio.
        </p>
      </section>
    )
  }

  return (
    <section className="bg-card/10 border-b border-primary/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-secondary" />
          Portfolio ({portfolio.length}/9)
        </h3>
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="text-xs px-2 py-1 rounded bg-primary/10 border border-primary/30 hover:border-primary/50 transition-all"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </motion.button>
      </div>
      <motion.div
        layout
        className={cn(
          'grid gap-2',
          expanded ? 'grid-cols-4' : 'grid-cols-5 md:grid-cols-8'
        )}
      >
        {positionsWithCharts.map((position) => {
          const isActive = activeStockId === position.id
          const sectorColor = SECTOR_COLORS[position.sector]
          const rarityColor = RARITY_COLORS[position.rarity]
          const isProfit = position.profit >= 0

          return (
            <Popover key={position.id}>
              <PopoverTrigger asChild>
                <motion.button
                  onClick={() => handleCardClick(position.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'rounded-lg border-2 p-3 flex flex-col justify-between gap-2',
                    'bg-card hover:bg-accent transition-all duration-200',
                    'min-h-[180px]',
                    isActive && 'ring-2 ring-primary ring-offset-2',
                    position.rarity === 'legendary' && 'border-secondary shadow-lg shadow-secondary/20',
                    position.rarity === 'epic' && 'border-purple-500 shadow-lg shadow-purple-500/20',
                    position.rarity === 'rare' && 'border-blue-500',
                    position.rarity === 'common' && 'border-border',
                    !expanded && 'p-1 min-h-0'
                  )}
                  style={{
                    borderColor: isActive ? '#fbbf24' : sectorColor,
                  }}
                >
                  {expanded ? (
                    <>
                      {/* Top Section: Stock Info */}
                      <div className="flex flex-col items-start gap-1 w-full">
                        <div className="flex items-center justify-between w-full">
                          <div className="text-sm font-bold">{position.symbol}</div>
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0"
                            style={{
                              borderColor: rarityColor,
                              color: rarityColor,
                            }}
                          >
                            {position.rarity}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{position.stockName}</div>
                        <div className="text-xs" style={{ color: sectorColor }}>
                          {position.sector}
                        </div>
                      </div>

                      {/* Middle Section: Chart */}
                      {position.chartData.length > 0 && (
                        <div className="w-full h-16 flex-shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={position.chartData}>
                              <Line
                                type="monotone"
                                dataKey="price"
                                stroke={isProfit ? '#22c55e' : '#ef4444'}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Bottom Section: Price and Profit */}
                      <div className="flex flex-col items-start gap-1 w-full">
                        <div className="text-xs text-muted-foreground">
                          ${position.currentPrice.toFixed(2)}
                        </div>
                        <div
                          className={cn(
                            'text-xs font-semibold flex items-center gap-1',
                            isProfit ? 'text-green-500' : 'text-red-500'
                          )}
                        >
                          {isProfit ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {isProfit ? '+' : ''}
                          {position.profit.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isProfit ? '+' : ''}${position.profitAmount.toFixed(2)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs sm:text-sm font-bold">{position.symbol}</div>
                      {position.chartData.length > 0 && (
                        <div className="w-full h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={position.chartData}>
                              <Line
                                type="monotone"
                                dataKey="price"
                                stroke={isProfit ? '#22c55e' : '#ef4444'}
                                strokeWidth={1}
                                dot={false}
                                isAnimationActive={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  )}
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{position.stockName}</h4>
                      <p className="text-xs text-muted-foreground">{position.symbol}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: rarityColor,
                        color: rarityColor,
                      }}
                    >
                      {position.rarity}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sector:</span>
                      <span style={{ color: sectorColor }}>{position.sector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buy Price:</span>
                      <span>${position.buyPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Price:</span>
                      <span>${position.currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span>{position.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit:</span>
                      <span
                        className={isProfit ? 'text-green-500' : 'text-red-500'}
                      >
                        {isProfit ? '+' : ''}
                        {position.profit.toFixed(2)}% ({isProfit ? '+' : ''}
                        ${position.profitAmount.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <button
                      onClick={() => handleCardClick(position.id)}
                      className="w-full text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
                    >
                      View Chart
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        })}
      </motion.div>
    </section>
  )
}
