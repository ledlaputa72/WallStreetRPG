'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Users, Lock, CheckCircle2, Sword, Heart, Zap, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const mockPartners = [
  { id: '1', name: 'Luna', level: 42, class: 'Mage', inParty: true, unlocked: true, position: 'back', slot: 1 },
  { id: '2', name: 'Kai', level: 40, class: 'Rogue', inParty: true, unlocked: true, position: 'front', slot: 1 },
  { id: '3', name: 'Zara', level: 43, class: 'Healer', inParty: true, unlocked: true, position: 'back', slot: 2 },
  { id: '4', name: 'Thorne', level: 38, class: 'Knight', inParty: false, unlocked: true, position: null, slot: null },
  { id: '5', name: 'Aria', level: 35, class: 'Archer', inParty: false, unlocked: true, position: null, slot: null },
  { id: '6', name: 'Vex', level: 0, class: 'Assassin', inParty: false, unlocked: false, position: null, slot: null },
  { id: '7', name: 'Nyx', level: 0, class: 'Summoner', inParty: false, unlocked: false, position: null, slot: null },
  { id: '8', name: 'Rex', level: 0, class: 'Berserker', inParty: false, unlocked: false, position: null, slot: null },
]

export function PartnersPage() {
  const [selectedPartner, setSelectedPartner] = useState<typeof mockPartners[0] | null>(null)
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterTier, setFilterTier] = useState('all')
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null)
  const [formationSlots] = useState({
    front: [mockPartners[1], null, null],
    back: [mockPartners[0], mockPartners[2], null],
  })

  const mockSkills = [
    { id: 'skill1', name: 'Power Strike', type: 'Active', level: 5, atkBonus: 250, defBonus: 0, hpBonus: 0, upCost: 5000 },
    { id: 'skill2', name: 'Battle Cry', type: 'Passive', level: 3, atkBonus: 50, defBonus: 0, hpBonus: 0, upCost: 3000 },
    { id: 'skill3', name: 'Magic Shield', type: 'Active', level: 4, atkBonus: 0, defBonus: 150, hpBonus: 300, upCost: 4500 },
  ]

  const filteredPartners = mockPartners.filter(partner => {
    if (!partner.unlocked) return false
    if (filterLevel !== 'all' && partner.level.toString() !== filterLevel) return false
    if (filterTier !== 'all') return false
    return true
  })

  const activePartners = filteredPartners.filter(p => p.inParty)
  const inactivePartners = filteredPartners.filter(p => !p.inParty)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto p-4 space-y-4">
          {/* Formation Setup */}
          <Card className="p-4 bg-gradient-to-br from-card to-primary/5">
            {/* Back Row */}
            <div className="mb-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-start pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Back Row</h4>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2">
                  {formationSlots.back.map((partner, idx) => (
                    <motion.button
                      key={`back-${idx}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'aspect-square rounded-lg border-2 border-dashed p-3 flex flex-col items-center justify-center gap-1',
                        partner ? 'bg-primary/10 border-primary/50' : 'bg-muted/20 border-muted-foreground/30'
                      )}
                    >
                      {partner ? (
                        <>
                          <Shield className="w-6 h-6 text-primary" />
                          <span className="text-xs font-medium text-center">{partner.name}</span>
                          <Badge variant="secondary" className="text-[10px]">Lv.{partner.level}</Badge>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Empty</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Front Row */}
            <div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-start pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Front Row</h4>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2">
                  {formationSlots.front.map((partner, idx) => (
                    <motion.button
                      key={`front-${idx}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'aspect-square rounded-lg border-2 border-dashed p-3 flex flex-col items-center justify-center gap-1',
                        partner ? 'bg-primary/10 border-primary/50' : 'bg-muted/20 border-muted-foreground/30'
                      )}
                    >
                      {partner ? (
                        <>
                          <Shield className="w-6 h-6 text-primary" />
                          <span className="text-xs font-medium text-center">{partner.name}</span>
                          <Badge variant="secondary" className="text-[10px]">Lv.{partner.level}</Badge>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Empty</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Partner Collection */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Partner Collection
              </h3>
              <div className="flex gap-2">
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-[120px] text-xs">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="35">Lv. 35</SelectItem>
                    <SelectItem value="38">Lv. 38</SelectItem>
                    <SelectItem value="40">Lv. 40</SelectItem>
                    <SelectItem value="42">Lv. 42</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger className="w-[120px] text-xs">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Active Partners */}
              {activePartners.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">In Party</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {activePartners.map((partner, idx) => (
                      <motion.div
                        key={partner.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card
                          className={cn(
                            'p-3 cursor-pointer transition-all duration-200 hover:scale-105',
                            'bg-card hover:border-primary/50 ring-2 ring-primary/50'
                          )}
                          onClick={() => setSelectedPartner(partner)}
                        >
                          <div className="grid grid-cols-2 gap-2 h-full">
                            {/* Right Top - Avatar */}
                            <div className="col-start-2 row-start-1 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-primary" />
                              </div>
                            </div>
                            
                            {/* Left Top - Name & Level Grid */}
                            <div className="col-start-1 row-start-1 space-y-1">
                              <h4 className="font-semibold text-xs line-clamp-1">{partner.name}</h4>
                              <Badge variant="outline" className="text-[10px] w-fit">Lv.{partner.level}</Badge>
                            </div>
                            
                            {/* Left Middle - Class */}
                            <div className="col-start-1 row-start-2">
                              <div className="text-[10px] text-muted-foreground">Class</div>
                              <div className="text-xs font-semibold">{partner.class}</div>
                            </div>
                            
                            {/* Right Middle - EXP/HP/MP */}
                            <div className="col-start-2 row-start-2 space-y-0.5">
                              <div className="text-[10px] text-muted-foreground">HP/MP</div>
                              <div className="text-xs font-semibold">8000/1000</div>
                            </div>
                            
                            {/* Bottom - Status */}
                            <div className="col-start-1 col-end-3 row-start-3">
                              <Badge variant="default" className="text-[10px] w-full justify-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                In Party
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive Partners - 2xN Grid */}
              {inactivePartners.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Available</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {inactivePartners.map((partner, idx) => (
                      <motion.div
                        key={partner.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card
                          className={cn(
                            'p-3 cursor-pointer transition-all duration-200 hover:scale-105',
                            'bg-card hover:border-primary/50'
                          )}
                          onClick={() => setSelectedPartner(partner)}
                        >
                          <div className="grid grid-cols-2 gap-2 h-full">
                            {/* Right Top - Avatar */}
                            <div className="col-start-2 row-start-1 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-primary" />
                              </div>
                            </div>
                            
                            {/* Left Top - Name & Level Grid */}
                            <div className="col-start-1 row-start-1 space-y-1">
                              <h4 className="font-semibold text-xs line-clamp-1">{partner.name}</h4>
                              <Badge variant="outline" className="text-[10px] w-fit">Lv.{partner.level}</Badge>
                            </div>
                            
                            {/* Left Middle - Class */}
                            <div className="col-start-1 row-start-2">
                              <div className="text-[10px] text-muted-foreground">Class</div>
                              <div className="text-xs font-semibold">{partner.class}</div>
                            </div>
                            
                            {/* Right Middle - EXP/HP/MP */}
                            <div className="col-start-2 row-start-2 space-y-0.5">
                              <div className="text-[10px] text-muted-foreground">HP/MP</div>
                              <div className="text-xs font-semibold">8000/1000</div>
                            </div>
                            
                            {/* Bottom - Status */}
                            <div className="col-start-1 col-end-3 row-start-3">
                              <Badge variant="secondary" className="text-[10px] w-full justify-center">
                                Available
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Partner Detail Modal - Full Screen */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="!fixed !top-0 !left-0 !right-0 !bottom-16 !translate-x-0 !translate-y-0 !max-w-none !w-full !h-[calc(100vh-4rem)] !rounded-none !border-0 !p-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom">
          <div className="h-full flex flex-col bg-background overflow-hidden">
            <DialogHeader className="flex-shrink-0 border-b border-border p-4">
              <DialogTitle className="text-2xl">{selectedPartner?.name}</DialogTitle>
            </DialogHeader>
            {selectedPartner && (
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-4">
                  {/* Partner Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-2 border-4 border-primary/30">
                      <Shield className="w-12 h-12 text-primary" />
                    </div>
                    <Badge variant="secondary" className="mb-1 text-xs">Level {selectedPartner.level}</Badge>
                    <Badge variant="outline" className="text-xs">{selectedPartner.class}</Badge>
                  </div>

                  {/* Equipment Slots - 5x2 */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Equipment</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {Array(10).fill(null).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/20 flex items-center justify-center hover:border-primary/50 transition-colors"
                        >
                          <span className="text-[10px] text-muted-foreground">Slot</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Stats - 3x2 Grid Format */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Stats</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 text-center"
                      >
                        <Sword className="w-4 h-4 mx-auto text-primary mb-1" />
                        <div className="text-xl font-bold text-primary">1811</div>
                        <div className="text-[10px] text-muted-foreground">ATK</div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 }}
                        className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-400/10 border border-blue-500/30 text-center"
                      >
                        <Shield className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                        <div className="text-xl font-bold text-blue-400">1878</div>
                        <div className="text-[10px] text-muted-foreground">DEF</div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="p-3 rounded-lg bg-gradient-to-br from-red-500/20 to-red-400/10 border border-red-500/30 text-center"
                      >
                        <Heart className="w-4 h-4 mx-auto text-red-400 mb-1" />
                        <div className="text-xl font-bold text-red-400">7022</div>
                        <div className="text-[10px] text-muted-foreground">HP</div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 }}
                        className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-400/10 border border-yellow-500/30 text-center"
                      >
                        <Zap className="w-4 h-4 mx-auto text-yellow-400 mb-1" />
                        <div className="text-xl font-bold text-yellow-400">156</div>
                        <div className="text-[10px] text-muted-foreground">SPD</div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="p-3 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-400/10 border border-orange-500/30 text-center"
                      >
                        <Zap className="w-4 h-4 mx-auto text-orange-400 mb-1" />
                        <div className="text-xl font-bold text-orange-400">38%</div>
                        <div className="text-[10px] text-muted-foreground">CRIT</div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                        className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-400/10 border border-purple-500/30 text-center"
                      >
                        <Heart className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                        <div className="text-xl font-bold text-purple-400">3689</div>
                        <div className="text-[10px] text-muted-foreground">PWR</div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Skills - Expandable */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">Skills</h4>
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
                  </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full bg-transparent text-xs">
                  <Zap className="w-4 h-4 mr-1" />
                  Level Up
                </Button>
                <Button variant="secondary" className="w-full text-xs">
                  <Shield className="w-4 h-4 mr-1" />
                  Equipment
                </Button>
              </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
