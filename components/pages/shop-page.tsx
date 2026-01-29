'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ShoppingBag, Users, Package, Sparkles, Gem, Coins, Clock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const heroSummons = [
  { id: '1', name: 'Standard Summon', cost: 100, currency: 'gems', type: 'single' },
  { id: '2', name: 'Premium Summon x10', cost: 900, currency: 'gems', type: 'multi', discount: '10% OFF' },
  { id: '3', name: 'Featured Hero Banner', cost: 150, currency: 'gems', type: 'single', featured: true },
]

const equipmentGacha = [
  { id: '1', name: 'Equipment Draw', cost: 50, currency: 'gems', type: 'single' },
  { id: '2', name: 'Equipment Draw x10', cost: 450, currency: 'gems', type: 'multi', discount: '10% OFF' },
  { id: '3', name: 'Legendary Gear Box', cost: 500, currency: 'gems', type: 'special' },
]

const dailyShop = [
  { id: '1', name: 'Health Potion x10', cost: 1000, currency: 'gold', stock: 5 },
  { id: '2', name: 'Mana Potion x10', cost: 1000, currency: 'gold', stock: 5 },
  { id: '3', name: 'EXP Boost (24h)', cost: 50, currency: 'gems', stock: 1 },
  { id: '4', name: 'Dungeon Ticket x5', cost: 100, currency: 'gems', stock: 3 },
  { id: '5', name: 'Rare Equipment Box', cost: 200, currency: 'gems', stock: 2 },
  { id: '6', name: 'Skill Book Fragment', cost: 5000, currency: 'gold', stock: 10 },
]

export function ShopPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="container max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="text-center space-y-2 py-4">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
            <ShoppingBag className="w-8 h-8 text-primary" />
            Shop
          </h2>
          
          {/* Currency Display */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 bg-card px-4 py-2 rounded-lg border border-border">
              <Gem className="w-4 h-4 text-primary" />
              <span className="font-semibold">2,450</span>
              <span className="text-muted-foreground">Gems</span>
            </div>
            <div className="flex items-center gap-1.5 bg-card px-4 py-2 rounded-lg border border-border">
              <Coins className="w-4 h-4 text-secondary" />
              <span className="font-semibold">125,800</span>
              <span className="text-muted-foreground">Gold</span>
            </div>
          </div>
        </div>

        {/* Shop Tabs */}
        <Tabs defaultValue="summon" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summon">
              <Users className="w-4 h-4 mr-2" />
              Hero Summon
            </TabsTrigger>
            <TabsTrigger value="equipment">
              <Package className="w-4 h-4 mr-2" />
              Equipment
            </TabsTrigger>
            <TabsTrigger value="daily">
              <Clock className="w-4 h-4 mr-2" />
              Daily Shop
            </TabsTrigger>
          </TabsList>

          {/* Hero Summon Tab */}
          <TabsContent value="summon" className="space-y-4">
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-4 pr-4">
                {heroSummons.map((summon, idx) => (
                  <motion.div
                    key={summon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className={cn(
                      'p-6 bg-gradient-to-br from-card to-card/50',
                      summon.featured && 'border-secondary/50 shadow-lg shadow-secondary/10'
                    )}>
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Icon */}
                        <div className={cn(
                          'w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0',
                          summon.featured ? 'bg-secondary/20' : 'bg-primary/20'
                        )}>
                          <Users className={cn(
                            'w-12 h-12',
                            summon.featured ? 'text-secondary' : 'text-primary'
                          )} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-center sm:text-left space-y-3">
                          <div>
                            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                              <h3 className="text-xl font-bold">{summon.name}</h3>
                              {summon.featured && (
                                <Badge variant="default" className="bg-secondary">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              {summon.discount && (
                                <Badge variant="secondary">{summon.discount}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {summon.type === 'multi' 
                                ? 'Summon 10 heroes at once with bonus rates!' 
                                : 'Try your luck to get powerful heroes'}
                            </p>
                          </div>

                          <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                            <Gem className="w-4 h-4 text-primary" />
                            <span className="text-2xl font-bold">{summon.cost}</span>
                            <span className="text-muted-foreground">Gems</span>
                          </div>
                        </div>

                        {/* Button */}
                        <Button 
                          size="lg"
                          variant={summon.featured ? 'default' : 'secondary'}
                          className={cn(
                            'w-full sm:w-auto min-w-[140px]',
                            summon.type === 'multi' && 'animate-pulse'
                          )}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {summon.type === 'multi' ? 'Summon x10' : 'Summon'}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Equipment Gacha Tab */}
          <TabsContent value="equipment" className="space-y-4">
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-4 pr-4">
                {equipmentGacha.map((gacha, idx) => (
                  <motion.div
                    key={gacha.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className={cn(
                      'p-6 bg-gradient-to-br from-card to-card/50',
                      gacha.type === 'special' && 'border-secondary/50 shadow-lg shadow-secondary/10'
                    )}>
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className={cn(
                          'w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0',
                          gacha.type === 'special' ? 'bg-secondary/20' : 'bg-primary/20'
                        )}>
                          <Package className={cn(
                            'w-12 h-12',
                            gacha.type === 'special' ? 'text-secondary' : 'text-primary'
                          )} />
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-3">
                          <div>
                            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                              <h3 className="text-xl font-bold">{gacha.name}</h3>
                              {gacha.discount && (
                                <Badge variant="secondary">{gacha.discount}</Badge>
                              )}
                              {gacha.type === 'special' && (
                                <Badge variant="default" className="bg-secondary">Legendary</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {gacha.type === 'special' 
                                ? 'Guaranteed legendary equipment!' 
                                : 'Get powerful equipment to strengthen your party'}
                            </p>
                          </div>

                          <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                            <Gem className="w-4 h-4 text-primary" />
                            <span className="text-2xl font-bold">{gacha.cost}</span>
                            <span className="text-muted-foreground">Gems</span>
                          </div>
                        </div>

                        <Button 
                          size="lg"
                          variant={gacha.type === 'special' ? 'default' : 'secondary'}
                          className="w-full sm:w-auto min-w-[140px]"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Draw
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Daily Shop Tab */}
          <TabsContent value="daily" className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <span className="text-sm font-medium">Shop Resets In:</span>
              <Badge variant="secondary" className="text-sm">
                <Clock className="w-3 h-3 mr-1" />
                12h 34m
              </Badge>
            </div>

            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
                {dailyShop.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="p-4 bg-card hover:bg-accent/30 transition-colors">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{item.name}</h4>
                            <div className="flex items-center gap-2">
                              {item.currency === 'gems' ? (
                                <Gem className="w-4 h-4 text-primary" />
                              ) : (
                                <Coins className="w-4 h-4 text-secondary" />
                              )}
                              <span className="font-bold text-lg">{item.cost.toLocaleString()}</span>
                            </div>
                          </div>
                          <Badge variant="outline">
                            Stock: {item.stock}
                          </Badge>
                        </div>

                        <Separator />

                        <Button size="sm" variant="secondary" className="w-full">
                          Purchase
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
