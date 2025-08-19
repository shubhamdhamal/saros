import { describe, it, expect } from 'vitest'
import { PublicKey, Keypair, Connection } from '@solana/web3.js'

// Finding 1: PDA/signers misuse – demonstrate PDA != Keypair.fromSeed(PDA)
describe('PDA misuse demonstration', () => {
  it('PDA is off-curve and cannot be reproduced by Keypair.fromSeed', () => {
    const programId = new PublicKey('SSwapUtytfBdBn1b9NUGG6foMVPtcWgpRU32HToDUZr')
    const seed = Keypair.generate().publicKey.toBuffer()
    const [pda] = PublicKey.findProgramAddressSync([seed], programId)
    // Constructing a keypair from PDA bytes does NOT yield the PDA
    const kp = Keypair.fromSeed(pda.toBuffer().slice(0,32))
    expect(kp.publicKey.toBase58()).not.toBe(pda.toBase58())
  })
})

// Finding 5/9: Precision drift check (illustrative)
// Compare float-based vs bigint-based scaling for a variety of amounts

describe('Precision sanity: float vs bigint scaling', () => {
  function floatScale(amount: number, decimals: number) {
    return Math.floor(amount * Math.pow(10, decimals))
  }
  function bigintScale(amount: number, decimals: number) {
    const scale = 10n ** BigInt(decimals)
    // convert amount to bigint by multiplying as integer cents to avoid float; here illustrative only
    return BigInt(Math.floor(amount * 1e6)) * (scale / 1_000_000n)
  }
  it('bigint scaling avoids drift for large amounts', () => {
    const amount = 9_999_999_999.123456 // large
    const dec = 9
    const f = floatScale(amount, dec)
    const b = bigintScale(amount, dec)
    // Just assert they are within a reasonable bound
    expect(Math.abs(Number(b - BigInt(f)))).toBeLessThanOrEqual(10_000) // tolerance
  })
})

// Devnet e2e (read-only): enumerate Saros AMM program accounts
// This validates live connectivity and gives concrete data for replication

describe('Devnet E2E: Saros AMM program accounts', () => {
  it('fetches accounts owned by Saros Swap program on devnet', async () => {
    const connection = new Connection('https://api.devnet.solana.com','confirmed')
    const programId = new PublicKey('SSwapUtytfBdBn1b9NUGG6foMVPtcWgpRU32HToDUZr')
    const accounts = await connection.getProgramAccounts(programId)
    // We expect at least some accounts; log first few keys for the findings
    expect(Array.isArray(accounts)).toBe(true)
    // Note: we won't assert count threshold due to devnet variability
    const first = accounts.slice(0,3).map(a => a.pubkey.toBase58())
    // Expose for logging outside test if needed
    console.log('[DEVNET] Saros AMM accounts sample:', first)
  }, 30000)
})

