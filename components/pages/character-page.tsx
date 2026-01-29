'use client'

import { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Shield, Sword, Heart, Zap, Activity, Target, TrendingUp, ArrowUpCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'

const heroStats = {
  name: 'Eldrin the Brave',
  level: 45,
  class: 'Warrior',
  atk: 2450,
  def: 1820,
  hp: 10000,
  maxHp: 10000,
  spd: 187,
  crt: 42,
}

const gearSlots = [
  { id: 'weapon', name: 'Dragon Slayer Sword', level: 45, rarity: 'legendary' as const, icon: Sword },
  { id: 'helmet', name: 'Knight\'s Helm', level: 42, rarity: 'epic' as const, icon: Shield },
  { id: 'armor', name: 'Plate Armor', level: 40, rarity: 'rare' as const, icon: Shield },
  { id: 'gloves', name: 'Steel Gauntlets', level: 38, rarity: 'rare' as const, icon: Shield },
  { id: 'boots', name: 'Swift Boots', level: 35, rarity: 'rare' as const, icon: Shield },
  { id: 'ring1', name: 'Ring of Power', level: 43, rarity: 'epic' as const, icon: Target },
  { id: 'ring2', name: 'Ring of Speed', level: 41, rarity: 'epic' as const, icon: Target },
  { id: 'amulet', name: 'Amulet of Life', level: 44, rarity: 'legendary' as const, icon: Heart },
  { id: 'cape', name: 'Shadow Cloak', level: 39, rarity: 'rare' as const, icon: Shield },
  { id: 'belt', name: 'Titan Belt', level: 37, rarity: 'rare' as const, icon: Shield },
]

function GearDialog({ gear }: { gear: typeof gearSlots[0] }) {
  const Icon = gear.icon
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className={cn(
          'w-24 h-24 rounded-lg flex items-center justify-center border-2',
          gear.rarity === 'legendary' && 'border-secondary bg-secondary/10',
          gear.rarity === 'epic' && 'border-purple-500 bg-purple-500/10',
          gear.rarity === 'rare' && 'border-blue-500 bg-blue-500/10'
        )}>
          <Icon className="w-12 h-12" />
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">ATK Bonus</span>
          <span className="font-semibold">+{Math.floor(Math.random() * 200) + 100}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">DEF Bonus</span>
          <span className="font-semibold">+{Math.floor(Math.random() * 150) + 50}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">HP Bonus</span>
          <span className="font-semibold">+{Math.floor(Math.random() * 500) + 200}</span>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="w-full bg-transparent">
          <ArrowUpCircle className="w-4 h-4 mr-2" />
          Reinforce
        </Button>
        <Button variant="secondary" className="w-full">
          <TrendingUp className="w-4 h-4 mr-2" />
          Change
        </Button>
      </div>
    </div>
  )
}

export function CharacterPage() {
  const isMobile = useMobile()
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null)
  const [expandedStatId, setExpandedStatId] = useState<string | null>(null)
  const [equipmentExpanded, setEquipmentExpanded] = useState(false)
  const DialogComponent = isMobile ? Drawer : Dialog
  const ContentComponent = isMobile ? DrawerContent : DialogContent
  const HeaderComponent = isMobile ? DrawerHeader : DialogHeader
  const TitleComponent = isMobile ? DrawerTitle : DialogTitle
  const TriggerComponent = isMobile ? DrawerTrigger : DialogTrigger

  const mockSkills = [
    { id: 'skill1', name: 'Power Slash', type: 'Active', level: 4, atkBonus: 200, defBonus: 0, hpBonus: 0, upCost: 4500 },
    { id: 'skill2', name: 'Battle Stance', type: 'Passive', level: 3, atkBonus: 0, defBonus: 100, hpBonus: 0, upCost: 3500 },
    { id: 'skill3', name: 'Intimidate', type: 'Active', level: 2, atkBonus: 150, defBonus: 50, hpBonus: 0, upCost: 5000 },
  ]

  const stats = [
    { id: 'atk', label: 'Attack', icon: Sword, value: 2450, base: 2200, bonus: 250, color: 'text-primary' },
    { id: 'def', label: 'Defense', icon: Shield, value: 1820, base: 1650, bonus: 170, color: 'text-blue-400' },
    { id: 'hp', label: 'HP', icon: Heart, value: 10000, base: 9500, bonus: 500, color: 'text-red-400' },
    { id: 'spd', label: 'Speed', icon: Zap, value: 187, base: 150, bonus: 37, color: 'text-yellow-400' },
    { id: 'crt', label: 'Critical', icon: Target, value: 42, base: 35, bonus: 7, color: 'text-orange-400', suffix: '%' },
    { id: 'pwr', label: 'Power', icon: Activity, value: 4270, base: 3850, bonus: 420, color: 'text-purple-400' },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto p-4 space-y-4">
          {/* Hero Details - Left Avatar, Right Info Grid */}
          <Card className="p-4 bg-gradient-to-br from-card via-card to-primary/5">
            <div className="flex gap-4">
              {/* Left - Avatar */}
              <div className="flex-shrink-0">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border-4 border-primary/30 flex items-center justify-center shadow-2xl shadow-primary/20"
                >
                  <Shield className="w-16 h-16 text-primary" />
                </motion.div>
              </div>

              {/* Right - Info Grid */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                {/* Top Left - Name */}
                <div className="col-start-1 row-start-1">
                  <h2 className="text-lg font-bold">{heroStats.name}</h2>
                </div>

                {/* Top Right - Level */}
                <div className="col-start-2 row-start-1 text-right">
                  <Badge variant="secondary" className="text-xs">Level {heroStats.level}</Badge>
                </div>

                {/* Middle Left - Class Label */}
                <div className="col-start-1 row-start-2">
                  <div className="text-xs text-muted-foreground">Class</div>
                </div>

                {/* Middle Right - Class Value */}
                <div className="col-start-2 row-start-2 text-right">
                  <Badge variant="outline" className="text-xs">{heroStats.class}</Badge>
                </div>

                {/* Bottom - Experience */}
                <div className="col-start-1 col-end-3 row-start-3">
                  <div className="text-xs text-muted-foreground mb-1">Experience</div>
                  <div className="relative h-2 bg-background rounded-full overflow-hidden border border-border">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: '65%' }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">6500/10000</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Section - Clickable for details */}
          <Card className="p-4">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Stats
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.id}
                    onClick={() => setExpandedStatId(expandedStatId === stat.id ? null : stat.id)}
                    className="cursor-pointer"
                  >
                    <div className={cn(
                      'p-3 rounded-lg border border-border hover:border-primary/50 transition-all',
                      expandedStatId === stat.id && 'border-primary/50 bg-primary/5'
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{stat.label}</span>
                        </div>
                      </div>
                      <div className={cn('text-xl font-bold', stat.color)}>
                        {stat.value}{stat.suffix || ''}
                      </div>
                      <AnimatePresence>
                        {expandedStatId === stat.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-1 text-[10px] text-muted-foreground space-y-0.5"
                          >
                            <div>Base: {stat.base}{stat.suffix || ''}</div>
                            <div className="text-primary">Bonus: +{stat.bonus}{stat.suffix || ''}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>

          {/* Equipment - Collapsible 10x1 / 5x2 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Equipment
              </h3>
              <motion.button
                onClick={() => setEquipmentExpanded(!equipmentExpanded)}
                className="text-xs px-3 py-1 rounded-lg bg-primary/10 border border-primary/30 hover:border-primary/50 transition-all"
              >
                {equipmentExpanded ? 'Collapse' : 'Expand'}
              </motion.button>
            </div>
            <motion.div
              layout
              className={cn(
                'grid gap-2',
                equipmentExpanded ? 'grid-cols-5' : 'grid-cols-10'
              )}
            >
              {gearSlots.map((gear) => {
                const Icon = gear.icon
                
                return (
                  <DialogComponent key={gear.id}>
                    <TriggerComponent asChild>
                      <button
                        className={cn(
                          'aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center gap-1',
                          'bg-card hover:bg-accent transition-all duration-200 hover:scale-105',
                          gear.rarity === 'legendary' && 'border-secondary shadow-lg shadow-secondary/20',
                          gear.rarity === 'epic' && 'border-purple-500 shadow-lg shadow-purple-500/20',
                          gear.rarity === 'rare' && 'border-blue-500'
                        )}
                      >
                        <Icon className={cn(
                          'w-6 h-6',
                          gear.rarity === 'legendary' && 'text-secondary',
                          gear.rarity === 'epic' && 'text-purple-500',
                          gear.rarity === 'rare' && 'text-blue-500'
                        )} />
                        <span className="text-[10px] font-medium text-center line-clamp-1">{gear.name}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0">+{gear.level}</Badge>
                      </button>
                    </TriggerComponent>
                  <ContentComponent>
                    <HeaderComponent>
                      <TitleComponent className="flex items-center justify-between">
                        <span>{gear.name}</span>
                        <Badge variant="outline">Lv.{gear.level}</Badge>
                      </TitleComponent>
                    </HeaderComponent>
                    <GearDialog gear={gear} />
                  </ContentComponent>
                </DialogComponent>
              )
            })}
            </motion.div>
          </Card>

          {/* Skills Section */}
          <Card className="p-4">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Skills
            </h3>
            <div className="space-y-2">
              {mockSkills.map((skill) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card
                    className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => setExpandedSkillId(expandedSkillId === skill.id ? null : skill.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{skill.name}</span>
                          <Badge variant="outline" className="text-[10px]">{skill.type}</Badge>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSkillId === skill.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {expandedSkillId === skill.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <Separator className="my-2" />
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Skill Level</span>
                              <span className="font-semibold">{skill.level}</span>
                            </div>
                            {skill.atkBonus > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ATK Bonus</span>
                                <span className="font-semibold text-primary">+{skill.atkBonus}%</span>
                              </div>
                            )}
                            {skill.defBonus > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">DEF Bonus</span>
                                <span className="font-semibold text-blue-400">+{skill.defBonus}%</span>
                              </div>
                            )}
                            {skill.hpBonus > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">HP Bonus</span>
                                <span className="font-semibold text-red-400">+{skill.hpBonus}</span>
                              </div>
                            )}
                            <Separator className="my-2" />
                            <div className="grid grid-cols-2 gap-2">
                              <Button size="sm" variant="secondary" className="text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                Level Up
                              </Button>
                              <div className="flex items-center justify-center text-xs text-muted-foreground">
                                <span>Cost: {skill.upCost.toLocaleString()} Gold</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
