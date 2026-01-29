'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Castle, Star, Ticket, Sword, Shield, Sparkles, Crown, Skull, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const mockDungeons = [
  {
    id: '1',
    name: 'Shadow Cavern',
    difficulty: 3,
    requiredTickets: 1,
    recommendedLevel: 35,
    loot: ['Rare Equipment', 'Gold Coins', 'EXP Crystals'],
    boss: 'Shadow Wyrm',
    description: 'A dark cavern filled with shadow creatures',
  },
  {
    id: '2',
    name: 'Frozen Temple',
    difficulty: 4,
    recommendedLevel: 40,
    requiredTickets: 2,
    loot: ['Epic Armor', 'Ice Shards', 'Skill Books'],
    boss: 'Frost Guardian',
    description: 'An ancient temple frozen in eternal ice',
  },
  {
    id: '3',
    name: 'Demon Fortress',
    difficulty: 5,
    recommendedLevel: 45,
    requiredTickets: 3,
    loot: ['Legendary Weapons', 'Demon Essence', 'Rare Materials'],
    boss: 'Demon Overlord',
    description: 'A massive fortress ruled by demonic forces',
  },
  {
    id: '4',
    name: 'Dragon\'s Lair',
    difficulty: 5,
    recommendedLevel: 50,
    requiredTickets: 5,
    loot: ['Legendary Equipment', 'Dragon Scales', 'Ancient Relics'],
    boss: 'Elder Dragon',
    description: 'The sacred dwelling of an ancient dragon',
  },
  {
    id: '5',
    name: 'Void Abyss',
    difficulty: 5,
    recommendedLevel: 55,
    requiredTickets: 10,
    loot: ['Mythic Gear', 'Void Crystals', 'Godly Materials'],
    boss: 'Void Emperor',
    description: 'A dimension beyond reality itself',
  },
]

export function DungeonPage() {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleEnterDungeon = () => {
    router.push('/battle')
  }

  const toggleDungeon = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-4 space-y-4">
          {/* Header */}
          <div className="text-center space-y-2 py-4">
            <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Castle className="w-8 h-8 text-primary" />
              Dungeon Explorer
            </h2>
            <p className="text-sm text-muted-foreground">
              Challenge powerful dungeons for legendary rewards
            </p>
          </div>

          {/* Dungeons List */}
          <ScrollArea className="h-[calc(100vh-14rem)]">
            <div className="space-y-2 pr-4">
              {mockDungeons.map((dungeon, idx) => {
                const isExpanded = expandedId === dungeon.id

                return (
                  <motion.div
                    key={dungeon.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={cn(
                        'overflow-hidden transition-all duration-300 cursor-pointer',
                        'bg-gradient-to-br from-card to-card/50 hover:border-primary/50',
                        isExpanded && 'border-primary/50 shadow-lg',
                        dungeon.difficulty === 5 && 'border-secondary/50'
                      )}
                      onClick={() => toggleDungeon(dungeon.id)}
                    >
                      {/* Collapsed Header */}
                      <div className="p-3 sm:p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Difficulty Badge */}
                          <Badge 
                            variant={dungeon.difficulty === 5 ? 'default' : 'secondary'}
                            className={cn(
                              'flex-shrink-0 flex items-center gap-1',
                              dungeon.difficulty === 5 && 'bg-secondary text-secondary-foreground'
                            )}
                          >
                            {Array.from({ length: dungeon.difficulty }).map((_, i) => (
                              <Star key={i} className="w-2 h-2 fill-current" />
                            ))}
                          </Badge>

                          {/* Dungeon Name & Description */}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm sm:text-base truncate">{dungeon.name}</h3>
                            <p className="text-xs text-muted-foreground truncate hidden sm:block">
                              {dungeon.description}
                            </p>
                          </div>

                          {/* Boss Badge */}
                          <Badge variant="destructive" className="flex-shrink-0 text-xs flex items-center gap-1">
                            {dungeon.difficulty === 5 ? (
                              <Crown className="w-2 h-2" />
                            ) : (
                              <Skull className="w-2 h-2" />
                            )}
                            <span>{dungeon.boss.split(' ')[0]}</span>
                          </Badge>
                        </div>

                        {/* Chevron */}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-2 flex-shrink-0"
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <Separator />
                            <div className="p-4 space-y-4">
                              {/* Details */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Sword className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <div className="text-xs text-muted-foreground">Recommended</div>
                                    <div className="font-semibold">Level {dungeon.recommendedLevel}</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Ticket className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <div className="text-xs text-muted-foreground">Entry Cost</div>
                                    <div className="font-semibold">{dungeon.requiredTickets} Ticket{dungeon.requiredTickets > 1 ? 's' : ''}</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Skull className="w-4 h-4 text-destructive flex-shrink-0" />
                                  <div>
                                    <div className="text-xs text-muted-foreground">Boss</div>
                                    <div className="font-semibold text-destructive">{dungeon.boss}</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-secondary flex-shrink-0" />
                                  <div>
                                    <div className="text-xs text-muted-foreground">Difficulty</div>
                                    <div className="font-semibold">
                                      {dungeon.difficulty === 5 ? 'Legendary' : 
                                       dungeon.difficulty === 4 ? 'Hard' : 
                                       dungeon.difficulty === 3 ? 'Medium' : 'Easy'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Loot Preview */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="w-4 h-4 text-secondary" />
                                  <span className="text-sm font-semibold">Possible Rewards</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {dungeon.loot.map((item, itemIdx) => (
                                    <Badge 
                                      key={itemIdx} 
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {item}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Action Button */}
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEnterDungeon()
                                }}
                                className="w-full"
                                variant={dungeon.difficulty === 5 ? 'default' : 'secondary'}
                                size="lg"
                              >
                                <Sword className="w-4 h-4 mr-2" />
                                Enter Dungeon
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
