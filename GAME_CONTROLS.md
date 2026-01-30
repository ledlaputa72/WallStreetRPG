# Wall Street RPG - Game Controls & Features

## 🎮 Start/Stop Simulation System

### Game States
- **IDLE**: No simulation running - chart is empty, waiting for user to start
- **LOADING**: Fetching historical data from API
- **PLAYING**: Simulation is running, animating day-by-day data

### Start/Stop Button
Located at the **front** of the chart controls (before "차트타입" button):

- **Green "Start" Button** (IDLE state):
  - Fetches ONE random ticker and ONE random year (1925-2025)
  - Loads ~250 trading days for that specific year
  - Begins sequential animation

- **Red "Stop" Button** (PLAYING state):
  - Stops the current animation immediately
  - Clears all chart data
  - Resets to IDLE state

- **Gray "Loading..." Button** (LOADING state):
  - Disabled while fetching data
  - Appears briefly during API call

### Chart Controls (Left to Right)
1. **Start/Stop** (Green/Red)
2. **차트타입** (Chart Type) - Orange
   - Area → Candle → Line → Area
3. **캔들개수** (Candle Count) - Purple
   - 20x → 30x → 40x → 20x
4. **속도** (Speed) - Blue
   - x1 → x2 → x3 → x4 → x5 → x1

## 📊 Simulation Features

### Single-Year Simulation
- When you press **Start**, the system:
  1. Randomly selects ONE stock ticker (e.g., Tesla, Apple, IBM)
  2. Randomly selects ONE year (1925-2025)
  3. Fetches/generates daily historical data for that entire year
  4. Displays the ticker name and year at the top (e.g., "Tesla (TSLA) - 2012")
  5. Animates the data sequentially, day by day

### Animation Speed
- Base interval: 200ms per candle
- Speed multiplier: Divides the interval
  - x1: 200ms per candle (~50 seconds for full year)
  - x2: 100ms per candle (~25 seconds)
  - x3: 67ms per candle (~17 seconds)
  - x4: 50ms per candle (~12 seconds)
  - x5: 40ms per candle (~10 seconds)

### Data Persistence
- The ticker and year **STAY FIXED** throughout the entire simulation
- No random shuffling during playback
- A new ticker/year is only selected when you:
  1. Press "Stop" and then "Start" again
  2. The year animation completes (automatic reset to IDLE)

## 🔧 Technical Implementation

### API Configuration
- **Alpha Vantage API Key**: Configured in `.env.local`
- **Historical Mode**: Currently uses simulated historical data (1925-2025)
  - This provides reliable, game-friendly data for any historical year
  - Real Alpha Vantage data can be integrated for recent years (2000-2024)

### Event System
- `CLEAR_CHART`: Clears all chart data when Stop is pressed
- `NEW_CANDLE`: Sends next day's data to Phaser scene
- Animation uses `setInterval` with speed-based timing

## 🚀 Next Steps

To test the new system:
1. Run `npm run dev`
2. Open http://localhost:3000
3. Press the green **Start** button
4. Watch a full year of historical stock data animate
5. Press the red **Stop** button to reset
6. Press **Start** again for a different stock/year

The simulation will automatically stop and reset to IDLE when a full year completes.
