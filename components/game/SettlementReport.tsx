'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGameStore } from '@/lib/stores/useGameStore'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Trophy, TrendingUp, TrendingDown, Award, Coins } from 'lucide-react'
import { RARITY_COLORS, type StockRarity } from '@/lib/types/stock'

interface SettlementReportProps {
  onNewGame: () => void
  onContinue?: () => void
}

export function SettlementReport({ onNewGame, onContinue }: SettlementReportProps) {
  const aum = useGameStore(state => state.aum) || 0
  const totalAssets = useGameStore(state => state.totalAssets)
  const dailyCapitalInflow = useGameStore(state => state.dailyCapitalInflow)
  const currentDayIndex = useGameStore(state => state.currentDayIndex)
  const portfolioReturn = useGameStore(state => state.calculatePortfolioReturn())
  const sp500Return = useGameStore(state => state.calculateSP500Return())
  const portfolio = useGameStore(state => state.portfolioAssets)
  const alphaTarget = useGameStore(state => state.alphaTarget)

  const investmentProfit = totalAssets - aum - dailyCapitalInflow * currentDayIndex

  const isVictory = useMemo(() => {
    const targetProfit = aum * 1.5
    const alphaAchieved = portfolioReturn > (sp500Return + alphaTarget)
    return totalAssets >= targetProfit || alphaAchieved
  }, [aum, totalAssets, portfolioReturn, sp500Return, alphaTarget])

  const mvpStock = useMemo(() => {
    if (portfolio.length === 0) return null

    return portfolio.reduce((best, current) => {
      const currentProfit = (current.currentPrice - current.buyPrice) * current.quantity
      const bestProfit = (best.currentPrice - best.buyPrice) * best.quantity
      return currentProfit > bestProfit ? current : best
    })
  }, [portfolio])

  const performanceData = useMemo(() => {
    // Generate comparison data points
    const points = []
    const days = 252
    const portfolioStart = aum
    const sp500Start = 100 // Normalized to 100

    for (let i = 0; i <= days; i += 10) {
      const portfolioValue = portfolioStart + (totalAssets - portfolioStart) * (i / days)
      const sp500Value = sp500Start + (sp500Start * (sp500Return / 100)) * (i / days)

      points.push({
        day: i,
        portfolio: ((portfolioValue - portfolioStart) / portfolioStart) * 100,
        sp500: ((sp500Value - sp500Start) / sp500Start) * 100,
      })
    }

    return points
  }, [aum, totalAssets, sp500Return])

  const rewardAmount = useMemo(() => {
    return Math.floor(Math.max(0, investmentProfit) * 0.1) // 10% of investment profit only
  }, [investmentProfit])

  const alphaAchieved = portfolioReturn - sp500Return

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl space-y-6"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">
                  {isVictory ? '🎉 Victory!' : 'Game Complete'}
                </CardTitle>
                <CardDescription className="mt-2">
                  Year-end settlement report
                </CardDescription>
              </div>
              {isVictory && (
                <Trophy className="w-12 h-12 text-yellow-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Summary */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Performance Summary</h3>
              <Card>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <XAxis
                        dataKey="day"
                        label={{ value: 'Trading Days', position: 'insideBottom', offset: -5 }}
                        tick={{ fill: '#94a3b8' }}
                      />
                      <YAxis
                        label={{ value: 'Return %', angle: -90, position: 'insideLeft' }}
                        tick={{ fill: '#94a3b8' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '4px',
                        }}
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="portfolio"
                        stroke="#fbbf24"
                        strokeWidth={3}
                        name="Your Portfolio"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="sp500"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        name="S&P 500"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Portfolio Return</div>
                    <div
                      className={`text-2xl font-bold ${
                        portfolioReturn >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {portfolioReturn >= 0 ? '+' : ''}
                      {portfolioReturn.toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">S&P 500 Return</div>
                    <div
                      className={`text-2xl font-bold ${
                        sp500Return >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {sp500Return >= 0 ? '+' : ''}
                      {sp500Return.toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Alpha</div>
                    <div
                      className={`text-2xl font-bold ${
                        alphaAchieved >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {alphaAchieved >= 0 ? '+' : ''}
                      {alphaAchieved.toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Final Assets</div>
                    <div className="text-2xl font-bold">
                      ${totalAssets.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* MVP Stock */}
            {mvpStock && (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">MVP Stock</h3>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{mvpStock.symbol}</span>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: RARITY_COLORS[mvpStock.rarity as StockRarity],
                              color: RARITY_COLORS[mvpStock.rarity as StockRarity],
                            }}
                          >
                            {mvpStock.rarity}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {mvpStock.stockName}
                        </div>
                        <div className="mt-2 text-sm">
                          Profit:{' '}
                          <span
                            className={`font-semibold ${
                              (mvpStock.currentPrice - mvpStock.buyPrice) * mvpStock.quantity >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            {(mvpStock.currentPrice - mvpStock.buyPrice) * mvpStock.quantity >= 0
                              ? '+'
                              : ''}
                            $
                            {Math.abs(
                              (mvpStock.currentPrice - mvpStock.buyPrice) * mvpStock.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <Award className="w-16 h-16 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Rewards */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Rewards</h3>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold">Game Currency</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-500">
                        +{rewardAmount.toLocaleString()} Gold
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Converted from realized profits
                      </div>
                    </div>
                    {isVictory && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Bonus Reward</div>
                        <div className="text-lg font-bold text-purple-500">
                          +1 CEO Card
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button onClick={onNewGame} variant="outline" className="flex-1">
                New Game
              </Button>
              {onContinue && (
                <Button onClick={onContinue} className="flex-1">
                  Continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
