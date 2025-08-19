import { describe, it, expect } from 'vitest'

// Demonstrate critical bug: utils/math.ts uses bitwise shifts with offset=64.
// In JS, bitwise shifts operate on 32-bit integers; x << 64 == x << (64 % 32) == x << 0.
// So mulShr(x, y, 64, ...) divides by 1 instead of 2^64, producing grossly incorrect results.

function mulDivNumber(x: number, y: number, denominator: number, rounding: 'up'|'down') {
  const prod = x * y
  if (rounding === 'up') return Math.floor((prod + denominator - 1) / denominator)
  return Math.floor(prod / denominator)
}

function correctMulShr(x: number, y: number, offset: number, rounding: 'up'|'down') {
  const denom = Math.pow(2, offset)
  return mulDivNumber(x, y, denom, rounding)
}

// Emulate current buggy utils
function buggyMulShr(x: number, y: number, offset: number, rounding: 'up'|'down') {
  const denom = 1 << offset // BUG: with offset=64, denom==1
  return mulDivNumber(x, y, denom, rounding)
}

function correctShlDiv(x: number, y: number, offset: number, rounding: 'up'|'down') {
  const scale = Math.pow(2, offset)
  return mulDivNumber(x, scale, y, rounding)
}

function buggyShlDiv(x: number, y: number, offset: number, rounding: 'up'|'down') {
  const scale = 1 << offset // BUG: with offset=64, scale==1
  return mulDivNumber(x, scale, y, rounding)
}

describe('DLMM utils/math 64-bit scaling bug', () => {
  const OFFSET = 64
  it('mulShr should divide by 2^64, but buggy version divides by 1', () => {
    const x = 1_000_000
    const y = 500_000
    const correct = correctMulShr(x, y, OFFSET, 'down')
    const buggy = buggyMulShr(x, y, OFFSET, 'down')
    expect(buggy).not.toBe(correct)
    // correct should be tiny; buggy is x*y
    expect(buggy).toBe(x * y)
    expect(correct).toBeGreaterThanOrEqual(0)
  })

  it('shlDiv should multiply by 2^64 then divide by y, buggy uses 1', () => {
    const x = 1_000_000
    const y = 2_000_000
    const correct = correctShlDiv(x, y, OFFSET, 'down')
    const buggy = buggyShlDiv(x, y, OFFSET, 'down')
    expect(buggy).not.toBe(correct)
    // buggy equals floor(x / y)
    expect(buggy).toBe(Math.floor(x / y))
    // correct scales by 2^64 and is orders of magnitude larger
    expect(correct).toBeGreaterThan(buggy * 1_000_000)
  })
})

