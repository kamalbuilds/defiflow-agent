import axios from 'axios';
import { agentCall, agentView } from '../../lib/shade-agent';

// Ref Finance API endpoints
const REF_INDEXER_API = 'https://api.stats.ref.finance/api';

export interface RefFinanceYield {
  protocol: string;
  chain: string;
  pool: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  impermanentLoss: number;
  token0: string;
  token1: string;
  farmAPR?: number;
}

export async function fetchRefFinanceYields(): Promise<RefFinanceYield[]> {
  try {
    // Mock Ref Finance data - replace with actual Ref Finance API calls
    const pools = [
      {
        pool: 'NEAR/USDT',
        token0: 'NEAR',
        token1: 'USDT',
        apy: 18.2,
        farmAPR: 12.5,
        tvl: 25000000,
        volume24h: 5000000
      },
      {
        pool: 'NEAR/USDC',
        token0: 'NEAR',
        token1: 'USDC',
        apy: 16.8,
        farmAPR: 10.2,
        tvl: 20000000,
        volume24h: 4000000
      },
      {
        pool: 'wETH/NEAR',
        token0: 'wETH',
        token1: 'NEAR',
        apy: 14.5,
        farmAPR: 8.5,
        tvl: 15000000,
        volume24h: 3000000
      },
      {
        pool: 'USDT/USDC',
        token0: 'USDT',
        token1: 'USDC',
        apy: 5.2,
        farmAPR: 3.1,
        tvl: 40000000,
        volume24h: 10000000
      }
    ];
    
    return pools.map(pool => ({
      protocol: 'Ref Finance',
      chain: 'near',
      pool: pool.pool,
      apy: pool.apy + (pool.farmAPR || 0),
      tvl: pool.tvl,
      risk: calculateRisk(pool.apy, pool.tvl),
      impermanentLoss: calculateIL(pool.token0, pool.token1),
      token0: pool.token0,
      token1: pool.token1,
      farmAPR: pool.farmAPR
    }));
  } catch (error) {
    console.error('Error fetching Ref Finance yields:', error);
    return [];
  }
}

function calculateRisk(apy: number, tvl: number): 'low' | 'medium' | 'high' {
  if (tvl > 20000000 && apy < 15) return 'low';
  if (tvl > 5000000 && apy < 25) return 'medium';
  return 'high';
}

function calculateIL(token0: string, token1: string): number {
  const stableCoins = ['USDT', 'USDC', 'DAI', 'USN'];
  
  if (stableCoins.includes(token0) && stableCoins.includes(token1)) {
    return 0.1;
  }
  
  if (stableCoins.includes(token0) || stableCoins.includes(token1)) {
    return 4.2;
  }
  
  return 6.5;
}

export async function getRefFinanceUserPositions(accountId: string) {
  try {
    // This would query Ref Finance contracts on NEAR
    // Mock user position data
    return {
      accountId,
      positions: [
        {
          poolId: 'NEAR-USDT',
          shares: '1000000',
          token0Amount: '500',
          token1Amount: '5000',
          unclaimedRewards: '25.5'
        },
        {
          poolId: 'NEAR-USDC',
          shares: '500000',
          token0Amount: '250',
          token1Amount: '2500',
          unclaimedRewards: '12.3'
        }
      ],
      totalValueLocked: '15000',
      totalRewards: '37.8'
    };
  } catch (error) {
    console.error('Error fetching Ref Finance positions:', error);
    return null;
  }
}

export async function estimateRefFinanceSwap(
  tokenIn: string,
  tokenOut: string,
  amountIn: string
) {
  try {
    // Estimate swap output and price impact
    // Mock estimation
    const mockRate = 10.5; // tokenOut per tokenIn
    const amountInNum = parseFloat(amountIn);
    
    return {
      tokenIn,
      tokenOut,
      amountIn,
      estimatedOut: (amountInNum * mockRate).toFixed(2),
      priceImpact: '0.15%',
      fee: '0.3%',
      route: [`${tokenIn} -> ${tokenOut}`]
    };
  } catch (error) {
    console.error('Error estimating Ref Finance swap:', error);
    return null;
  }
}