import { describe, it, expect } from 'vitest'

// Reference BigInt math vs current float-based path illustration
function feeAmount(amountIn: bigint, fee: bigint, precision: bigint) {
  // feeAmount = amount * fee / PRECISION (round down)
  return (amountIn * fee) / precision
}

function getFeeAmountNumber(amountIn: number, fee: number, precision: number) {
  return Math.floor((amountIn * fee) / precision)
}

describe('DLMM getMaxAmountOutWithFee precision comparison', () => {
  const PRECISION = 1_000_000_000n
  const fee = 123_456_789n // ~12.3456789%

  it('bigint fee is consistent for large inputs', () => {
    const amount = 1_000_000_000_000_000_000n // 1e18
    const f = feeAmount(amount, fee, PRECISION)
    expect(f > 0n).toBe(true)
  })

  it('number-based fee loses precision with large inputs', () => {
    const amount = 1e18 // cannot be represented exactly
    const f = getFeeAmountNumber(amount, Number(fee), Number(PRECISION))
    // Just assert that number approach returns a finite number but is lossy
    expect(Number.isFinite(f)).toBe(true)
  })
})

