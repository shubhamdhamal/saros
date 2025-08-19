import { describe, it, expect } from 'vitest'

// Finding 2: Fee bypass logic in getSwapAmountSaros
// We reproduce the core logic and verify the buggy and fixed behaviors.

describe('AMM getSwapAmountSaros fee logic', () => {
  function buggy(fromAmount: number, feeNum: number, feeDen: number) {
    let fromAmountWithFee =
      (fromAmount * (feeDen - feeNum)) / feeDen
    if (feeDen === 0 || (feeNum as any)) { // buggy truthy check on numerator
      fromAmountWithFee = fromAmount
    }
    return fromAmountWithFee
  }

  function fixed(fromAmount: number, feeNum: number, feeDen: number) {
    if (feeDen === 0 || feeNum === 0) return fromAmount
    return (fromAmount * (feeDen - feeNum)) / feeDen
  }

  it('bypasses fee in buggy version when numerator is non-zero', () => {
    const out = buggy(1000, 30, 10000)
    expect(out).toBe(1000)
  })

  it('applies fee correctly in fixed version', () => {
    const out = fixed(1000, 30, 10000)
    expect(out).toBeCloseTo(997, 6)
  })

  it('handles zero denominator by not applying fee', () => {
    expect(fixed(1000, 30, 0)).toBe(1000)
  })
})

// DLMM priceImpact guard PoC

describe('DLMM getQuote priceImpact guard', () => {
  function priceImpact(amountOut: number, maxAmountOut: number) {
    if (maxAmountOut === 0) return 0
    return ((amountOut - maxAmountOut) / maxAmountOut) * 100
  }

  it('returns 0 instead of Infinity/NaN when maxAmountOut is 0', () => {
    expect(priceImpact(0, 0)).toBe(0)
    expect(priceImpact(10, 0)).toBe(0)
  })
})

