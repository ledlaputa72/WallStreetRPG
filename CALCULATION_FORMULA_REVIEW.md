# 전체 계산 수식 검토 및 수정

## 문제 상황
- 첫 선택 금액: $4,000 (2개 종목)
- 화면 표시 금액이 모두 맞지 않음
- Cash balance가 음수로 표시됨
- 포트폴리오 카드 합계와 Total Assets가 불일치

## 전체 계산 수식 검토

### 1. 초기 자본 설정 (handleDraftComplete)

**위치**: `components/pages/battle-page.tsx:245-319`

**수식**:
```
for each selected card:
  actualFirstDayPrice = stockResult.data[0].close
  actualTotalCost = actualFirstDayPrice * priceInfo.quantity
  totalCost += actualTotalCost

realizedProfit = AUM - totalCost
```

**설명**:
- 각 카드의 실제 첫날 종가를 사용하여 `totalCost` 계산
- `realizedProfit` = AUM - totalCost (현금 잔액)
- ✅ 올바름

### 2. 포지션 생성

**위치**: `components/pages/battle-page.tsx:274-286`

**수식**:
```
position = {
  buyPrice: actualFirstDayPrice,
  quantity: priceInfo.quantity,
  currentPrice: actualFirstDayPrice,
  currentDayIndex: 0,
  ...
}
```

**설명**:
- 포지션의 `buyPrice`와 `currentPrice`는 실제 첫날 종가로 설정
- ✅ 올바름

### 3. 포트폴리오 가치 계산 (calculatePortfolioValue)

**위치**: `lib/stores/useGameStore.ts:236-255`

**수식**:
```
unrealizedProfit = Σ(position.currentPrice × position.quantity)
totalAssets = realizedProfit + unrealizedProfit
```

**설명**:
- `unrealizedProfit` = 모든 포지션의 현재 시가 총액
- `totalAssets` = 현금(realizedProfit) + 주식 가치(unrealizedProfit)
- ✅ 올바름

**초기 상태 검증**:
```
totalAssets = (AUM - totalCost) + (Σ(actualFirstDayPrice × quantity))
           = (AUM - totalCost) + totalCost
           = AUM
```
✅ 초기 상태에서 `totalAssets`는 `AUM`과 일치해야 함

### 4. 일일 자본 유입 (incrementDay)

**위치**: `lib/stores/useGameStore.ts:210-226`

**수식**:
```
dailyCapitalInflow = AUM × 0.001 × (1 + ceoCapitalBonus)
realizedProfit = realizedProfit + dailyCapitalInflow
currentDayIndex = currentDayIndex + 1
```

**설명**:
- 매일 AUM의 0.1%가 현금으로 추가됨
- 예: AUM $10,000 → 매일 $10 추가
- ✅ 올바름

**주의사항**:
- `currentDayIndex`가 0일 때는 `incrementDay`가 호출되지 않아야 함
- 게임 시작 시점(day 0)에서는 아직 자본 유입이 없음

### 5. 포지션 가격 업데이트 (updatePositionPrice)

**위치**: `lib/stores/useGameStore.ts:148-157`

**수식**:
```
position.currentPrice = newPrice
position.currentDayIndex = dayIndex
calculatePortfolioValue() // 자동 호출
```

**설명**:
- 포지션의 현재 가격을 업데이트하고 `calculatePortfolioValue` 호출
- ✅ 올바름

### 6. QuickInventory 표시 금액

**위치**: `components/battle/ui/QuickInventory.tsx:32-59`

**수식**:
```
currentPrice = position.currentPrice  // updatePositionPrice에 의해 업데이트됨
profit = ((currentPrice - buyPrice) / buyPrice) × 100
profitAmount = (currentPrice - buyPrice) × quantity
totalValue = currentPrice × quantity
```

**설명**:
- `position.currentPrice`를 직접 사용 (이미 업데이트됨)
- `calculatePortfolioValue`와 일치하도록 수정됨
- ✅ 올바름

## 수정 사항

### 1. QuickInventory 수정
- `position.data[position.currentDayIndex]?.close` 대신 `position.currentPrice` 사용
- `calculatePortfolioValue`와 일치하도록 수정

### 2. 검증 로직 추가
- `handleDraftComplete`에서 초기 `totalAssets`가 `AUM`과 일치하는지 검증

## 전체 계산 흐름

### 게임 시작 시점 (Day 0)
1. `handleDraftComplete` 호출
2. `totalCost` 계산 (실제 첫날 종가 × 수량)
3. `realizedProfit = AUM - totalCost` 설정
4. 포지션 추가 (각 포지션의 `currentPrice = actualFirstDayPrice`)
5. `calculatePortfolioValue()` 호출
6. 검증: `totalAssets` == `AUM`

### Day 1 이후
1. `incrementDay()` 호출
2. `realizedProfit += dailyCapitalInflow`
3. `currentDayIndex += 1`
4. `updatePositionPrice()` 호출 (각 포지션의 가격 업데이트)
5. `calculatePortfolioValue()` 호출
6. `totalAssets = realizedProfit + unrealizedProfit`

## 검증 공식

### 초기 상태 (Day 0)
```
totalAssets = realizedProfit + unrealizedProfit
           = (AUM - totalCost) + (Σ(actualFirstDayPrice × quantity))
           = (AUM - totalCost) + totalCost
           = AUM
```

### Day N 이후
```
totalAssets = realizedProfit + unrealizedProfit
           = (AUM - totalCost + N × dailyCapitalInflow) + (Σ(currentPrice × quantity))
```

## 결론

모든 계산 수식은 올바르게 구현되어 있습니다. 다만:
1. `QuickInventory`에서 `position.currentPrice`를 직접 사용하도록 수정
2. 초기 상태 검증 로직 추가
3. `incrementDay` 호출 시점 확인 (day 0에서는 호출되지 않아야 함)
