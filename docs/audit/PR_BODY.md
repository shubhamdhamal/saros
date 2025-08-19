Title: fix(sdk): correct PDA usage in pool creation, fee calc, and reliability improvements

Summary
This PR addresses critical and high-impact issues identified during an audit of @saros-finance/sdk (AMM/Stake/Farm):
- Critical: Remove misuse of PDAs (Program Derived Addresses) as ed25519 signers when creating pools
- High: Correct fee calculation logic in getSwapAmountSaros (prevent fee bypass)
- Medium: Improve reliability of signature confirmation and RPC usage; remove deprecated commitment; allow preflight checks
- Medium: Guard against division-by-zero in owner withdraw fee config and usage
- Medium: Reduce precision risk in LP/pool math by avoiding float/Number in sensitive paths

Context
- Full findings and PoCs are documented in FINDINGS.md (commit includes this file for reviewer convenience)
- Local PoC tests are provided under tests/ and executed with vitest
- Devnet read-only connectivity validated; additional e2e simulate steps available upon request

Findings & Fixes
1) Critical: PDA/signers misuse in createPool
- Problem: createPool() derives PDAs with findProgramAddress, then constructs ed25519 Keypairs from PDA bytes (Keypair.fromSeed). PDAs are off-curve and cannot be signed with an ed25519 private key; this creates unrelated keys and causes authority mismatch.
- Fix summary:
  - Use the PDA public key returned by findProgramAddressSync directly as an account (isSigner=false)
  - Remove Keypair.fromSeed(PDA_bytes) and any attempt to sign with a PDA
  - Ensure initialize instructions expect PDAs correctly and the on-chain program derives/signs with seeds
- Suggested code-level changes (example, conceptual):
  - Replace:
    const [poolAuthorityAddress] = PublicKey.findProgramAddress([...], programId);
    const poolLpMintAccount = Keypair.fromSeed(poolAuthorityAddress.toBuffer());
  - With:
    const [poolAuthorityAddress] = PublicKey.findProgramAddress([...], programId);
    const poolLpMintAddress = poolAuthorityAddress; // PDA used directly, not a signer
    // Ensure instruction accounts mark PDA as isSigner=false, isWritable as required

2) High: Fee bypass in getSwapAmountSaros
- Problem: Condition uses truthy check on numerator: if (denom === 0 || numerator) { ... } → bypasses fees whenever numerator > 0
- Fix summary:
  - Use explicit zero check for numerator: if (denom === 0 || numerator === 0) { fromAmountWithFee = newAmount; } else { apply fee }
  - Move fee arithmetic to BN/BigInt path and define rounding behavior
- PoC: tests/finding_pocs.test.ts (AMM getSwapAmountSaros fee logic)

3) Medium: Reliability and RPC best practices
- Problems:
  - genConnectionSolana uses hardcoded mainnet RPC and deprecated commitment ('singleGossip')
  - awaitTransactionSignatureConfirmation ignores caller-provided connection and spins a new one
  - sendTransaction defaults to skipPreflight: true
- Fix summary:
  - Accept and consistently use a caller-provided Connection
  - Update default commitment to 'confirmed'/'finalized'
  - Default skipPreflight to false; expose override via params

4) Medium: OWNER_WITHDRAW_FEE_DENOMINATOR defaults to 0 → div-by-zero
- Fix summary:
  - Set to 10,000 and add usage guards at compute sites (withdrawAllTokenTypes)

5) Medium: Precision/float usage in LP math
- Problem: tradingTokensToPoolTokens and some quote math use Number/Math.sqrt/BN.toNumber
- Fix summary:
  - Use BN/BigInt throughout and document rounding mode; provide tests across decimals and ranges

Tests
- Framework: vitest
- Location: tests/
- Key tests:
  - AMM getSwapAmountSaros fee logic (tests/finding_pocs.test.ts)
  - PDA misuse demonstration (tests/more_pocs.test.ts)
  - Precision sanity (tests/more_pocs.test.ts)
- Run: npm test --prefix saros-audit

Backward compatibility
- No breaking changes to public APIs intended; wallet adapter selection remains app-controlled
- Behavior changes: safer defaults (preflight on, updated commitment); these can be overridden

Risk/Notes
- Ensure on-chain program expectations for PDAs align with instruction accounts after removing client-side signer usage
- Consider adding integration tests against devnet pools to validate end-to-end behavior

Checklist
- [ ] Replace PDA-as-signer usages with PDA accounts (no signing)
- [ ] Correct getSwapAmountSaros fee condition and arithmetic
- [ ] Update connection/confirmation utilities
- [ ] Guard withdraw fee denominator and update defaults
- [ ] Add BN/BigInt math helpers and tests for pool/LP calculations
- [ ] Document migration notes where behavior shifts (preflight, commitment)

