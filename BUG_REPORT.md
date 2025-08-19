# Critical Bug Report: Slippage Calculation Error

## **Severity: CRITICAL**

## **Problem**
In the `depositAllTokenTypes` function, `token1Amount` incorrectly uses `newAmount0` for slippage calculation instead of `newAmount1`. This causes users to lose tokens on every liquidity provision transaction.

## **Location**
- **File**: `src/swap/sarosSwapServices.js`
- **Function**: `depositAllTokenTypes`
- **Line**: 425
- **Code**: `newAmount1 + renderAmountSlippage(newAmount0, slippage)`

## **Expected vs Actual**
```javascript
// Expected (Correct):
newAmount1 + renderAmountSlippage(newAmount1, slippage)

// Actual (Buggy):
newAmount1 + renderAmountSlippage(newAmount0, slippage)
```

## **Impact**
- Users lose tokens on every liquidity provision
- Pool imbalances affect all users
- Protocol integrity compromised
- Direct financial loss to users

## **Fix**
Change line 425 from:
```javascript
newAmount1 + renderAmountSlippage(newAmount0, slippage)
```
To:
```javascript
newAmount1 + renderAmountSlippage(newAmount1, slippage)
```

## **Test Case**
Run `node test-slippage-bug.js` to see the bug in action.

## **Why Critical**
This bug affects core DeFi functionality and causes direct financial loss to users. It needs immediate attention.
