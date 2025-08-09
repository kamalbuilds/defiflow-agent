/**
 * Utility functions for financial calculations used in yield optimization
 */

export interface CompoundingOptions {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  periods: number; // number of periods (e.g., days, weeks, etc.)
}

export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  var95: number; // Value at Risk at 95% confidence
}

export interface PortfolioMetrics {
  totalValue: number;
  weightedApy: number;
  riskScore: number;
  diversificationRatio: number;
  concentrationRisk: number;
}

/**
 * Calculate compound annual growth rate (CAGR)
 */
export function calculateCAGR(
  initialValue: number,
  finalValue: number,
  periods: number
): number {
  if (initialValue <= 0 || finalValue <= 0 || periods <= 0) {
    return 0;
  }
  
  return Math.pow(finalValue / initialValue, 1 / periods) - 1;
}

/**
 * Calculate compound interest with different compounding frequencies
 */
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  options: CompoundingOptions
): number {
  const frequencyMap = {
    daily: 365,
    weekly: 52,
    monthly: 12,
    quarterly: 4,
    yearly: 1
  };

  const compoundingFrequency = frequencyMap[options.frequency];
  const timeInYears = options.periods / compoundingFrequency;
  
  return principal * Math.pow(1 + annualRate / compoundingFrequency, compoundingFrequency * timeInYears);
}

/**
 * Calculate APY from APR considering compounding
 */
export function aprToApy(apr: number, compoundingFrequency: number = 365): number {
  return Math.pow(1 + apr / compoundingFrequency, compoundingFrequency) - 1;
}

/**
 * Calculate present value of future cash flows
 */
export function calculatePresentValue(
  futureValue: number,
  discountRate: number,
  periods: number
): number {
  return futureValue / Math.pow(1 + discountRate, periods);
}

/**
 * Calculate net present value of cash flows
 */
export function calculateNPV(
  cashFlows: number[],
  discountRate: number,
  initialInvestment: number = 0
): number {
  let npv = -initialInvestment;
  
  cashFlows.forEach((cashFlow, index) => {
    npv += cashFlow / Math.pow(1 + discountRate, index + 1);
  });

  return npv;
}

/**
 * Calculate internal rate of return (IRR)
 */
export function calculateIRR(
  cashFlows: number[],
  guess: number = 0.1,
  maxIterations: number = 100
): number {
  let rate = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;
    
    cashFlows.forEach((cashFlow, index) => {
      const power = index + 1;
      const denominator = Math.pow(1 + rate, power);
      npv += cashFlow / denominator;
      derivative -= power * cashFlow / Math.pow(1 + rate, power + 1);
    });
    
    if (Math.abs(npv) < 1e-6) {
      return rate;
    }
    
    const newRate = rate - npv / derivative;
    
    if (Math.abs(newRate - rate) < 1e-6) {
      return newRate;
    }
    
    rate = newRate;
  }
  
  return rate; // Return best approximation if not converged
}

/**
 * Calculate risk metrics for a series of returns
 */
export function calculateRiskMetrics(returns: number[]): RiskMetrics {
  if (returns.length < 2) {
    return {
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      var95: 0
    };
  }

  // Calculate mean and standard deviation
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized (assuming daily returns)

  // Calculate Sharpe ratio (assuming risk-free rate of 2%)
  const riskFreeRate = 0.02;
  const annualizedReturn = mean * 252;
  const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

  // Calculate maximum drawdown
  let peak = returns[0];
  let maxDrawdown = 0;
  let cumulativeReturn = 1;

  for (const ret of returns) {
    cumulativeReturn *= (1 + ret);
    
    if (cumulativeReturn > peak) {
      peak = cumulativeReturn;
    } else {
      const drawdown = (peak - cumulativeReturn) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }

  // Calculate 95% Value at Risk
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const var95Index = Math.floor(sortedReturns.length * 0.05);
  const var95 = sortedReturns[var95Index] || 0;

  return {
    volatility,
    sharpeRatio,
    maxDrawdown,
    var95
  };
}

/**
 * Calculate portfolio metrics
 */
export function calculatePortfolioMetrics(
  positions: Array<{
    value: number;
    apy: number;
    riskScore: number;
    protocol: string;
    chain: string;
  }>
): PortfolioMetrics {
  if (positions.length === 0) {
    return {
      totalValue: 0,
      weightedApy: 0,
      riskScore: 0,
      diversificationRatio: 0,
      concentrationRisk: 0
    };
  }

  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  // Calculate weighted APY
  const weightedApy = positions.reduce((sum, pos) => {
    const weight = pos.value / totalValue;
    return sum + (pos.apy * weight);
  }, 0);

  // Calculate weighted risk score
  const riskScore = positions.reduce((sum, pos) => {
    const weight = pos.value / totalValue;
    return sum + (pos.riskScore * weight);
  }, 0);

  // Calculate diversification metrics
  const protocolCounts = positions.reduce((counts, pos) => {
    counts[pos.protocol] = (counts[pos.protocol] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const chainCounts = positions.reduce((counts, pos) => {
    counts[pos.chain] = (counts[pos.chain] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const uniqueProtocols = Object.keys(protocolCounts).length;
  const uniqueChains = Object.keys(chainCounts).length;
  const diversificationRatio = (uniqueProtocols + uniqueChains) / (positions.length + 1);

  // Calculate concentration risk (Herfindahl-Hirschman Index)
  const concentrationRisk = positions.reduce((sum, pos) => {
    const weight = pos.value / totalValue;
    return sum + Math.pow(weight, 2);
  }, 0);

  return {
    totalValue,
    weightedApy,
    riskScore,
    diversificationRatio,
    concentrationRisk
  };
}

/**
 * Calculate optimal portfolio allocation using Modern Portfolio Theory
 */
export function calculateOptimalAllocation(
  assets: Array<{
    expectedReturn: number;
    volatility: number;
    correlation: number[];
  }>,
  riskTolerance: number = 0.5
): number[] {
  // Simplified mean-variance optimization
  // In a real implementation, this would use quadratic programming
  
  const numAssets = assets.length;
  if (numAssets === 0) return [];
  if (numAssets === 1) return [1.0];

  // Equal weight as starting point
  let weights = new Array(numAssets).fill(1 / numAssets);
  
  // Simple optimization: adjust weights based on risk-adjusted returns
  const riskAdjustedReturns = assets.map(asset => 
    asset.expectedReturn / (asset.volatility * (1 + riskTolerance))
  );
  
  const totalScore = riskAdjustedReturns.reduce((sum, score) => sum + score, 0);
  
  if (totalScore > 0) {
    weights = riskAdjustedReturns.map(score => score / totalScore);
  }

  // Ensure weights sum to 1
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (weightSum > 0) {
    weights = weights.map(w => w / weightSum);
  }

  return weights;
}

/**
 * Calculate gas cost in USD
 */
export function calculateGasCostUSD(
  gasUsed: number,
  gasPriceGwei: number,
  ethPriceUSD: number
): number {
  const gasCostETH = (gasUsed * gasPriceGwei) / 1e9; // Convert gwei to ETH
  return gasCostETH * ethPriceUSD;
}

/**
 * Calculate transaction break-even point
 */
export function calculateBreakEvenPoint(
  gasCostUSD: number,
  apyDifference: number,
  principal: number
): number {
  if (apyDifference <= 0) return Infinity;
  
  // Time in years to break even
  const annualGain = principal * (apyDifference / 100);
  return gasCostUSD / annualGain;
}

/**
 * Calculate impermanent loss for liquidity pools
 */
export function calculateImpermanentLoss(
  priceRatio: number // price_token1_end / price_token1_start
): number {
  if (priceRatio <= 0) return 0;
  
  const k = priceRatio;
  const hodlValue = 0.5 + 0.5 * k;
  const poolValue = Math.sqrt(k);
  
  return (poolValue - hodlValue) / hodlValue;
}

/**
 * Calculate loan-to-value ratio
 */
export function calculateLTV(
  loanAmount: number,
  collateralValue: number
): number {
  if (collateralValue <= 0) return 0;
  return loanAmount / collateralValue;
}

/**
 * Calculate liquidation price
 */
export function calculateLiquidationPrice(
  currentPrice: number,
  loanAmount: number,
  collateralAmount: number,
  liquidationRatio: number
): number {
  if (collateralAmount <= 0) return 0;
  return (loanAmount * liquidationRatio) / collateralAmount;
}

/**
 * Calculate health factor for lending positions
 */
export function calculateHealthFactor(
  collateralValueUSD: number,
  borrowValueUSD: number,
  liquidationThreshold: number
): number {
  if (borrowValueUSD <= 0) return Infinity;
  return (collateralValueUSD * liquidationThreshold) / borrowValueUSD;
}

/**
 * Utility function to format numbers as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

/**
 * Utility function to format percentages
 */
export function formatPercentage(
  value: number,
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}