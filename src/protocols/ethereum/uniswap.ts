import axios from 'axios';
import { ethers } from 'ethers';

export interface UniswapYield {
  protocol: string;
  chain: string;
  pool: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  impermanentLoss: number;
  token0: string;
  token1: string;
  fee: number;
}

export async function fetchUniswapV3Yields(): Promise<UniswapYield[]> {
  try {
    // Mock data for demonstration - replace with actual Uniswap V3 subgraph queries
    const mockPools = [
      {
        pool: 'ETH/USDC',
        token0: 'ETH',
        token1: 'USDC',
        fee: 0.3,
        apy: 12.5,
        tvl: 50000000,
        volume24h: 10000000
      },
      {
        pool: 'WBTC/ETH',
        token0: 'WBTC',
        token1: 'ETH',
        fee: 0.3,
        apy: 8.2,
        tvl: 30000000,
        volume24h: 5000000
      },
      {
        pool: 'USDC/USDT',
        token0: 'USDC',
        token1: 'USDT',
        fee: 0.01,
        apy: 4.5,
        tvl: 100000000,
        volume24h: 20000000
      }
    ];
    
    return mockPools.map(pool => ({
      protocol: 'Uniswap V3',
      chain: 'ethereum',
      pool: pool.pool,
      apy: pool.apy,
      tvl: pool.tvl,
      risk: calculateRisk(pool.apy, pool.tvl),
      impermanentLoss: calculateIL(pool.token0, pool.token1),
      token0: pool.token0,
      token1: pool.token1,
      fee: pool.fee
    }));
  } catch (error) {
    console.error('Error fetching Uniswap yields:', error);
    return [];
  }
}

function calculateRisk(apy: number, tvl: number): 'low' | 'medium' | 'high' {
  if (tvl > 50000000 && apy < 10) return 'low';
  if (tvl > 10000000 && apy < 20) return 'medium';
  return 'high';
}

function calculateIL(token0: string, token1: string): number {
  // Simplified IL calculation - in reality would use price history
  const stableCoins = ['USDC', 'USDT', 'DAI', 'USN'];
  
  if (stableCoins.includes(token0) && stableCoins.includes(token1)) {
    return 0.1; // Very low IL for stable pairs
  }
  
  if (stableCoins.includes(token0) || stableCoins.includes(token1)) {
    return 3.5; // Medium IL for stable/volatile pairs
  }
  
  return 5.5; // Higher IL for volatile pairs
}

export async function getUniswapPosition(poolAddress: string, userAddress: string) {
  // Fetch user's liquidity position in a specific pool
  try {
    // This would connect to Uniswap V3 contracts
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
    
    // Mock position data
    return {
      poolAddress,
      userAddress,
      liquidity: '1000000',
      token0Amount: '1.5',
      token1Amount: '3000',
      fees: {
        token0: '0.05',
        token1: '100'
      }
    };
  } catch (error) {
    console.error('Error fetching Uniswap position:', error);
    return null;
  }
}