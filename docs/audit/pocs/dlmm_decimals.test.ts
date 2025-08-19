import { describe, it, expect } from 'vitest'

// Emulate fetchPoolMetadata decimal assignment bug
// Correct assignment: baseReserve.decimals -> tokenBaseDecimal; quoteReserve.decimals -> tokenQuoteDecimal
// Buggy assignment swaps them.

describe('DLMM fetchPoolMetadata decimals assignment', () => {
  function scale(amount: number, decimals: number) {
    return amount / Math.pow(10, decimals)
  }
  const baseReserve = { amount: '1234500000', decimals: 6 }   // 1,234.5 base
  const quoteReserve = { amount: '987654321000', decimals: 9 } // 987.654321 quote (in 9-dec)

  it('correct decimals produce consistent price estimate', () => {
    const tokenBaseDecimal = baseReserve.decimals
    const tokenQuoteDecimal = quoteReserve.decimals
    const base = scale(Number(baseReserve.amount), tokenBaseDecimal)
    const quote = scale(Number(quoteReserve.amount), tokenQuoteDecimal)
    const price = quote / base
    expect(price).toBeGreaterThan(0)
  })

  it('swapped decimals distort the price materially', () => {
    const tokenBaseDecimal = quoteReserve.decimals // BUG
    const tokenQuoteDecimal = baseReserve.decimals // BUG
    const base = scale(Number(baseReserve.amount), tokenBaseDecimal)
    const quote = scale(Number(quoteReserve.amount), tokenQuoteDecimal)
    const buggyPrice = quote / base
    // Prices should differ by orders of magnitude due to swap
    expect(Math.abs(buggyPrice)).toBeGreaterThan(100)
  })
})

