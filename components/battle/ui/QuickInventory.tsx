'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '../types'

interface QuickInventoryProps {
  items: InventoryItem[]
}

export function QuickInventory({ items }: QuickInventoryProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <section className="bg-card/10 border-b border-primary/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-secondary" />
          Quick Inventory
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
          expanded ? 'grid-cols-5' : 'grid-cols-10'
        )}
      >
        {items.map((item) => (
          <Popover key={item.id}>
            <PopoverTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center gap-1',
                  'bg-card hover:bg-accent transition-all duration-200',
                  item.rarity === 'legendary' && 'border-secondary shadow-lg shadow-secondary/20',
                  item.rarity === 'epic' && 'border-purple-500 shadow-lg shadow-purple-500/20',
                  item.rarity === 'rare' && 'border-blue-500',
                  item.rarity === 'common' && 'border-border',
                  !expanded && 'p-1'
                )}
              >
                <Shield className={cn(
                  'w-5 h-5',
                  !expanded && 'w-3 h-3',
                  item.rarity === 'legendary' && 'text-secondary',
                  item.rarity === 'epic' && 'text-purple-500',
                  item.rarity === 'rare' && 'text-blue-500',
                  item.rarity === 'common' && 'text-muted-foreground'
                )} />
                {expanded && (
                  <>
                    <span className="text-xs sm:text-sm font-medium text-center line-clamp-1">{item.name}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">+{item.level}</Badge>
                  </>
                )}
              </motion.button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{item.name}</h4>
                  <Badge variant="outline" className="text-xs">Lv.{item.level}</Badge>
                </div>
                <Button size="sm" className="w-full" variant="secondary">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Quick Upgrade
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ))}
      </motion.div>
    </section>
  )
}
