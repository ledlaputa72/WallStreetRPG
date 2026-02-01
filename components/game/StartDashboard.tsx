'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useGameStore } from '@/lib/stores/useGameStore'
import { getSectorDistributionPreview, getAUMTier, AUM_TIERS } from '@/lib/utils/cardGenerator'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { TrendingUp, Target, Award, BarChart3 } from 'lucide-react'

interface StartDashboardProps {
  onStart: (aum: number) => void
}

const AUM_OPTIONS = [
  { value: 1000, label: '$1K', tier: 'Penny' as const },
  { value: 10000, label: '$10K', tier: 'Value' as const },
  { value: 100000, label: '$100K', tier: 'Growth' as const },
  { value: 1000000, label: '$1M', tier: 'BlueChip' as const },
]

export function StartDashboard({ onStart }: StartDashboardProps) {
  const [selectedAUM, setSelectedAUM] = useState(10000)
  const [alphaTarget, setAlphaTarget] = useState(15)

  const tier = useMemo(() => getAUMTier(selectedAUM), [selectedAUM])
  const tierConfig = AUM_TIERS[tier]
  const sectorDistribution = useMemo(
    () => getSectorDistributionPreview(selectedAUM),
    [selectedAUM]
  )

  const sectorChartData = useMemo(() => {
    return Object.entries(sectorDistribution).map(([sector, value]) => ({
      sector,
      value: value * 100, // Convert to percentage
    }))
  }, [sectorDistribution])

  const targetProfit = useMemo(() => {
    return selectedAUM * 1.5 // 50% gain target
  }, [selectedAUM])

  const handleStart = () => {
    useGameStore.getState().setAUM(selectedAUM)
    useGameStore.getState().alphaTarget = alphaTarget
    onStart(selectedAUM)
  }

  const sectorColors: Record<string, string> = {
    IT: '#ef4444',
    Value: '#3b82f6',
    Defensive: '#22c55e',
    Dividend: '#a855f7',
    Energy: '#f59e0b',
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-background overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl h-full flex flex-col"
      >
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-2xl md:text-3xl font-bold text-center">
              Market Beat - New Game
            </CardTitle>
            <CardDescription className="text-center text-xs sm:text-sm">
              Select your initial capital and start investing
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4 overflow-y-auto">
            {/* AUM Selector */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Initial Capital (AUM)
                </label>
                <div className="flex gap-2 mb-3">
                  {AUM_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedAUM === option.value ? 'default' : 'outline'}
                      onClick={() => setSelectedAUM(option.value)}
                      className="flex-1 text-xs sm:text-sm"
                      size="sm"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <Slider
                  value={[selectedAUM]}
                  onValueChange={([value]) => setSelectedAUM(value)}
                  min={1000}
                  max={1000000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$1K</span>
                  <span className="font-semibold">
                    ${(selectedAUM / 1000).toFixed(0)}K
                  </span>
                  <span>$1M</span>
                </div>
              </div>

              {/* Tier Info */}
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{tierConfig.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ${selectedAUM.toLocaleString()} initial capital
                    </div>
                  </div>
                  <Award className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Sector Distribution Preview - Clickable Button */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Expected Sector Distribution</label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">View Sector Distribution</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Click to view chart</span>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Expected Sector Distribution</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sectorChartData}>
                        <XAxis
                          dataKey="sector"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <YAxis
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          label={{ value: '%', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          formatter={(value: number) => `${value.toFixed(1)}%`}
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '4px',
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {sectorChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={sectorColors[entry.sector] || '#6b7280'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Victory Conditions */}
            <div className="space-y-3">
              <label className="text-sm font-semibold">Victory Conditions</label>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">Target Assets</span>
                    </div>
                    <div className="text-xl font-bold">
                      ${targetProfit.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      Achieve 50% gain
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">Alpha Target</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={alphaTarget}
                        onChange={(e) => setAlphaTarget(Number(e.target.value))}
                        min={0}
                        max={50}
                        className="w-16 px-2 py-1 bg-background border border-primary/20 rounded text-xl font-bold text-sm"
                      />
                      <span className="text-xl font-bold">%</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      Beat S&P 500
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Start Button */}
            <div className="flex-shrink-0 pt-2">
              <Button
                onClick={handleStart}
                size="lg"
                className="w-full"
              >
                Start Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
