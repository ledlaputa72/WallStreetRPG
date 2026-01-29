'use client'

import { Checkbox } from "@/components/ui/checkbox"
import { Trash2 } from 'lucide-react';

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Sword, Sparkles, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const mockItems = Array.from({ length: 50 }, (_, i) => ({
  id: `item-${i}`,
  name: i % 15 === 0 ? 'Legendary Dragon Blade' : 
        i % 10 === 0 ? 'Epic Titan Shield' : 
        i % 5 === 0 ? 'Rare Mystic Ring' : 
        `Common Item ${i + 1}`,
  level: Math.floor(Math.random() * 50) + 1,
  rarity: i % 15 === 0 ? 'legendary' : 
          i % 10 === 0 ? 'epic' : 
          i % 5 === 0 ? 'rare' : 
          'common' as const,
  type: i % 3 === 0 ? 'weapon' : i % 3 === 1 ? 'armor' : 'accessory' as const,
  atk: Math.floor(Math.random() * 300) + 50,
  def: Math.floor(Math.random() * 200) + 30,
}))

export function ItemsPage() {
  const [selectedItem, setSelectedItem] = useState<typeof mockItems[0] | null>(null)
  const [sortBy, setSortBy] = useState('rarity')
  const [filterRarity, setFilterRarity] = useState('all')

  const filteredItems = mockItems
    .filter(item => filterRarity === 'all' || item.rarity === filterRarity)
    .sort((a, b) => {
      if (sortBy === 'rarity') {
        const rarityOrder: Record<string, number> = { legendary: 4, epic: 3, rare: 2, common: 1 }
        return rarityOrder[b.rarity] - rarityOrder[a.rarity]
      }
      if (sortBy === 'level') {
        return b.level - a.level
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })

  const getItemIcon = (type: string) => {
    if (type === 'weapon') return Sword
    if (type === 'armor') return Shield
    return Sparkles
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto p-4 space-y-3">
          {/* Controls */}
          <Card className="p-3">
            <div className="flex gap-2 items-center flex-wrap">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] text-xs">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rarity">Sort by Rarity</SelectItem>
                  <SelectItem value="level">Sort by Level</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRarity} onValueChange={setFilterRarity}>
                <SelectTrigger className="w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rarities</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="common">Common</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Items Grid */}
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pr-3">
              {filteredItems.map((item, idx) => {
                const Icon = getItemIcon(item.type)
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.01 }}
                  >
                    <Card
                      className={cn(
                        'p-2 cursor-pointer transition-all duration-200 hover:scale-105',
                        'border-2',
                        item.rarity === 'legendary' && 'border-secondary bg-secondary/5 shadow-lg shadow-secondary/20',
                        item.rarity === 'epic' && 'border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/20',
                        item.rarity === 'rare' && 'border-blue-500 bg-blue-500/5',
                        item.rarity === 'common' && 'border-border bg-card'
                      )}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {/* Icon */}
                        <div className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center',
                          item.rarity === 'legendary' && 'bg-secondary/20',
                          item.rarity === 'epic' && 'bg-purple-500/20',
                          item.rarity === 'rare' && 'bg-blue-500/20',
                          item.rarity === 'common' && 'bg-muted/50'
                        )}>
                          <Icon className={cn(
                            'w-6 h-6',
                            item.rarity === 'legendary' && 'text-secondary',
                            item.rarity === 'epic' && 'text-purple-500',
                            item.rarity === 'rare' && 'text-blue-500',
                            item.rarity === 'common' && 'text-muted-foreground'
                          )} />
                        </div>

                        {/* Name */}
                        <h4 className="text-[10px] font-semibold text-center line-clamp-2 min-h-[1.5rem]">
                          {item.name}
                        </h4>

                        {/* Level Badge */}
                        <Badge variant="outline" className="text-[8px] px-1 py-0">
                          Lv.{item.level}
                        </Badge>

                        {/* Stats */}
                        <div className="w-full space-y-0.5 pt-1 border-t border-border/50">
                          <div className="flex items-center justify-between text-[8px]">
                            <span className="text-muted-foreground">
                              <Sword className="w-2 h-2 inline" />
                            </span>
                            <span className="font-semibold">+{item.atk}</span>
                          </div>
                          <div className="flex items-center justify-between text-[8px]">
                            <span className="text-muted-foreground">
                              <Shield className="w-2 h-2 inline" />
                            </span>
                            <span className="font-semibold">+{item.def}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Item Detail Modal - Bottom Aligned 4-Slot Size */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="fixed bottom-16 left-1/2 translate-x-[-50%] w-[calc(100%-2rem)] max-w-lg p-4 translate-y-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-20 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-20">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedItem?.name}</span>
              <Badge variant="outline">Lv.{selectedItem?.level}</Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Icon */}
              <div className="flex justify-center">
                <div className={cn(
                  'w-20 h-20 rounded-lg flex items-center justify-center',
                  selectedItem.rarity === 'legendary' && 'bg-secondary/20 border-2 border-secondary',
                  selectedItem.rarity === 'epic' && 'bg-purple-500/20 border-2 border-purple-500',
                  selectedItem.rarity === 'rare' && 'bg-blue-500/20 border-2 border-blue-500',
                  selectedItem.rarity === 'common' && 'bg-muted/50 border-2 border-border'
                )}>
                  {(() => {
                    const Icon = getItemIcon(selectedItem.type)
                    return (
                      <Icon className={cn(
                        'w-10 h-10',
                        selectedItem.rarity === 'legendary' && 'text-secondary',
                        selectedItem.rarity === 'epic' && 'text-purple-500',
                        selectedItem.rarity === 'rare' && 'text-blue-500',
                        selectedItem.rarity === 'common' && 'text-muted-foreground'
                      )} />
                    )
                  })()}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Stats</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 text-center">
                    <Sword className="w-4 h-4 mx-auto text-primary mb-1" />
                    <div className="text-lg font-bold text-primary">+{selectedItem.atk}</div>
                    <div className="text-[10px] text-muted-foreground">ATK</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-400/10 border border-blue-500/30 text-center">
                    <Shield className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                    <div className="text-lg font-bold text-blue-400">+{selectedItem.def}</div>
                    <div className="text-[10px] text-muted-foreground">DEF</div>
                  </div>
                </div>
              </div>

              {/* Type & Rarity */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 text-center">
                  <div className="text-[10px] text-muted-foreground mb-1">Type</div>
                  <div className="text-sm font-semibold text-primary capitalize">{selectedItem.type}</div>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 border border-secondary/30 text-center">
                  <div className="text-[10px] text-muted-foreground mb-1">Rarity</div>
                  <div className="text-sm font-semibold text-secondary capitalize">{selectedItem.rarity}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full bg-transparent text-xs">
                  Equip
                </Button>
                <Button variant="destructive" className="w-full text-xs">
                  Sell
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
