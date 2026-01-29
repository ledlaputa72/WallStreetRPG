# Battle System Architecture

## 📁 File Structure

```
components/battle/
├── types.ts                     # TypeScript type definitions
├── constants.ts                 # Mock data and constants
├── event-bus.ts                 # Event communication system
├── index.tsx                    # Main export file (Phaser wrapper)
├── phaser-game.tsx              # Phaser game React wrapper
├── hooks/
│   └── usePhaserGame.ts        # Custom hook for Phaser game logic
├── scenes/
│   └── battle-scene.ts         # Main Phaser battle scene
└── ui/
    ├── StageInfo.tsx            # Stage and price information
    ├── ChartControls.tsx        # Chart type, candle count, speed controls
    ├── QuickInventory.tsx       # Inventory display
    ├── QuickSkills.tsx          # Skills display
    └── CharacterStats.tsx       # Party members HP/MP display
```

## 📦 Components Overview

### Core Files

#### `types.ts`
Centralized type definitions for:
- Character, Enemy, Boss types
- InventoryItem, Skill types
- ChartType, CandleCount, SpeedMultiplier types

#### `constants.ts`
Mock data for:
- Hero, Partners, Enemies, Boss
- Inventory items
- Skills

#### `hooks/usePhaserGame.ts`
Custom React hook that manages:
- Phaser game instance reference
- EventBus communication
- Chart state (type, candle count, speed)
- Price and profit tracking
- Event handlers for chart controls

### UI Components

#### `StageInfo.tsx`
Displays:
- Current stage and wave information
- Real-time price and profit percentage

**Props:**
```typescript
{
  stage: string
  currentWave: number
  maxWave: number
  profitPercent: string
  currentPrice: number
}
```

#### `ChartControls.tsx`
Provides controls for:
- Chart type (Area, Candle, Line)
- Candle count (20x, 30x, 40x)
- Speed multiplier (x1 to x5)

**Props:**
```typescript
{
  chartType: ChartType
  candleCount: CandleCount
  speedMultiplier: SpeedMultiplier
  onChartTypeChange: (type: ChartType) => void
  onCandleCountChange: (count: CandleCount) => void
  onSpeedChange: (speed: SpeedMultiplier) => void
}
```

#### `QuickInventory.tsx`
Displays:
- Grid of inventory items
- Item rarity colors (legendary, epic, rare, common)
- Expandable/collapsible view
- Item upgrade popover

**Props:**
```typescript
{
  items: InventoryItem[]
}
```

#### `QuickSkills.tsx`
Displays:
- Grid of skills
- Skill level and upgrade cost
- Expandable/collapsible view
- Skill upgrade popover

**Props:**
```typescript
{
  skills: Skill[]
}
```

#### `CharacterStats.tsx`
Displays:
- Party members (Hero + Partners)
- HP/MP progress bars
- Action ready indicator
- Expandable/collapsible view

**Props:**
```typescript
{
  characters: Character[]
}
```

## 🔄 Event Flow

1. **User Action** → UI Component (e.g., ChartControls button click)
2. **UI Component** → Hook Handler (e.g., `handleChartTypeChange`)
3. **Hook** → EventBus Emit (e.g., `CHANGE_CHART_TYPE`)
4. **EventBus** → Phaser Scene Listener
5. **Phaser Scene** → Updates chart rendering
6. **Phaser Scene** → Emits state changes (e.g., `PRICE_CHANGED`)
7. **Hook** → Updates React state
8. **React State** → UI Components re-render

## 🎯 Benefits of This Structure

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: UI components can be reused in other pages
3. **Maintainability**: Easy to find and modify specific features
4. **Testability**: Each component can be tested independently
5. **Scalability**: Easy to add new features without affecting existing code
6. **Type Safety**: Centralized types ensure consistency across the app

## 🚀 Adding New Features

### Adding a New UI Component

1. Create file in `components/battle/ui/NewComponent.tsx`
2. Define props interface
3. Import necessary types from `../types`
4. Export component

### Adding New Data Types

1. Add type definition to `types.ts`
2. Add mock data to `constants.ts` (if needed)
3. Update hook or component to use new type

### Adding New Chart Controls

1. Update `ChartControls.tsx` with new button/control
2. Add handler to `usePhaserGame.ts` hook
3. Emit event through EventBus
4. Handle event in `battle-scene.ts`

## 📝 Code Reduction

**Before:** 1030 lines in single file
**After:** 
- `battle-page.tsx`: ~100 lines
- `types.ts`: ~50 lines
- `constants.ts`: ~50 lines
- `usePhaserGame.ts`: ~90 lines
- UI Components: ~100 lines each

**Total:** ~690 lines across 9 files (33% reduction + better organization)

## 🔧 Maintenance Guide

- **Mock Data**: Edit `constants.ts`
- **Types**: Edit `types.ts`
- **Game Logic**: Edit `hooks/usePhaserGame.ts` or `scenes/battle-scene.ts`
- **UI Styling**: Edit individual UI component files
- **Layout**: Edit `pages/battle-page.tsx`

## 📚 Related Files

- Main page: `components/pages/battle-page.tsx`
- Backup: `components/pages/battle-page.backup.tsx` (original 1030 lines)
