/**
 * Test case demonstrating the critical slippage calculation bug in Saros SDK
 * Run with: node test-slippage-bug.js
 */

const mockPoolData = {
  token0Account: { amount: { toNumber: () => 1000000 } },
  token1Account: { amount: { toNumber: () => 500000000 } },
  lpTokenSupply: 1000000
};

const mockLpAmount = 1000;
const mockSlippage = 0.5;

const renderAmountSlippage = (amount, slippage) => {
  return (parseFloat(amount) * parseFloat(slippage)) / 100;
};

function calculateTokenAmountsBuggy() {
  const newAmount0 = Math.floor(
    (mockPoolData.token0Account.amount.toNumber() * mockLpAmount) / mockPoolData.lpTokenSupply
  );
  
  const newAmount1 = Math.floor(
    (mockPoolData.token1Account.amount.toNumber() * mockLpAmount) / mockPoolData.lpTokenSupply
  );
  
  const token0Amount = Math.floor(
    newAmount0 + renderAmountSlippage(newAmount0, mockSlippage)
  );
  
  // BUG: Uses newAmount0 instead of newAmount1 for slippage
  const token1Amount = Math.floor(
    newAmount1 + renderAmountSlippage(newAmount0, mockSlippage)
  );
  
  return { newAmount0, newAmount1, token0Amount, token1Amount };
}

function calculateTokenAmountsFixed() {
  const newAmount0 = Math.floor(
    (mockPoolData.token0Account.amount.toNumber() * mockLpAmount) / mockPoolData.lpTokenSupply
  );
  
  const newAmount1 = Math.floor(
    (mockPoolData.token1Account.amount.toNumber() * mockLpAmount) / mockPoolData.lpTokenSupply
  );
  
  const token0Amount = Math.floor(
    newAmount0 + renderAmountSlippage(newAmount0, mockSlippage)
  );
  
  // FIXED: Uses newAmount1 for slippage
  const token1Amount = Math.floor(
    newAmount1 + renderAmountSlippage(newAmount1, mockSlippage)
  );
  
  return { newAmount0, newAmount1, token0Amount, token1Amount };
}

const buggyResult = calculateTokenAmountsBuggy();
const fixedResult = calculateTokenAmountsFixed();

console.log('=== BUG DEMONSTRATION ===');
console.log('Pool: 1M USDC, 500M C98, 0.5% slippage');
console.log('User deposits 1000 LP tokens\n');

console.log('BUGGY VERSION (Current Code):');
console.log(`USDC: ${buggyResult.token0Amount} wei (correct)`);
console.log(`C98: ${buggyResult.token1Amount} wei (WRONG - uses USDC slippage)\n`);

console.log('FIXED VERSION:');
console.log(`USDC: ${fixedResult.token0Amount} wei (correct)`);
console.log(`C98: ${fixedResult.token1Amount} wei (correct - uses C98 slippage)\n`);

const slippageDifference = Math.abs(
  renderAmountSlippage(buggyResult.newAmount0, mockSlippage) - 
  renderAmountSlippage(buggyResult.newAmount1, mockSlippage)
);

console.log('IMPACT:');
console.log(`Slippage difference: ${slippageDifference} wei`);
console.log(`Users lose ${slippageDifference / 1000000} tokens per transaction`);
console.log('This affects EVERY liquidity provision transaction.');
