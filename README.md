# 🎮 Wall Street RPG

An epic idle RPG game combining financial markets with adventure gameplay. Battle monsters, collect items, and build your party in this unique Wall Street-themed RPG experience.

## ✨ Features

- **🗡️ Battle System**: Engage in strategic turn-based combat with a stock market chart interface
- **👥 Party Management**: Recruit and manage partners with unique abilities
- **🎒 Item Collection**: Collect and equip weapons, armor, and accessories
- **🏰 Dungeon Exploration**: Challenge various dungeons with different difficulties
- **🏪 Shop System**: Buy and sell items to enhance your party
- **🎁 Daily Rewards**: Earn rewards through daily login and quests
- **🌙 Dark Mode**: Beautiful dark theme optimized for extended play sessions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or higher
- npm, pnpm, or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd WallStreetRPG
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Set up environment variables (optional):
```bash
cp .env.example .env.local
```

### Development

Run the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

Create a production build:

```bash
npm run build
npm start
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theme**: next-themes (Dark mode support)

## 📁 Project Structure

```
WallStreetRPG/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main game page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── pages/             # Game page components
│   │   ├── battle-page.tsx
│   │   ├── character-page.tsx
│   │   ├── partners-page.tsx
│   │   ├── items-page.tsx
│   │   ├── dungeon-page.tsx
│   │   ├── shop-page.tsx
│   │   └── rewards-page.tsx
│   └── bottom-navigation.tsx
├── lib/
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
├── hooks/                 # Custom React hooks
├── public/                # Static assets (images, icons)
└── package.json
```

## 🎯 Game Pages

1. **Battle**: Main combat interface with stock chart visualization
2. **Character**: View and manage your main character stats
3. **Partners**: Recruit and organize your party members
4. **Items**: Manage your inventory and equipment
5. **Dungeon**: Select and challenge various dungeons
6. **Shop**: Buy and sell items
7. **Rewards**: Collect daily rewards and complete quests

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## 📝 License

This project is created with [v0.dev](https://v0.dev) by Vercel.

## 🙏 Acknowledgments

- Design and initial components generated with v0.dev
- UI components built with shadcn/ui
- Icons by Lucide React
