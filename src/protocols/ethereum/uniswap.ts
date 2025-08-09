import axios from 'axios';
import { ethers } from 'ethers';
import { requestSignature } from '../../lib/shade-agent';

// Uniswap V3 Subgraph URL
const UNISWAP_V3_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

export interface UniswapYield {
  protocol: string;
  chain: string;
  pool: string;
  poolAddress: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  impermanentLoss: number;
  token0: string;
  token1: string;
  fee: number;
  volume24h: number;
  feesEarned24h: number;
}

export async function fetchUniswapV3Yields(): Promise<UniswapYield[]> {
  try {
    // Query real Uniswap V3 data from The Graph
    const query = `
      query TopPools {
        pools(
          first: 20
          orderBy: totalValueLockedUSD
          orderDirection: desc
          where: { totalValueLockedUSD_gt: "1000000" }
        ) {
          id
          token0 {
            symbol
            name
            decimals
          }
          token1 {
            symbol
            name
            decimals
          }
          feeTier
          liquidity
          totalValueLockedUSD
          totalValueLockedToken0
          totalValueLockedToken1
          volumeUSD
          feesUSD
          poolDayData(first: 7, orderBy: date, orderDirection: desc) {
            volumeUSD
            feesUSD
            tvlUSD
          }
        }
      }
    `;

    const response = await axios.post(
      UNISWAP_V3_GRAPH_URL,
      { query },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.data || !response.data.data || !response.data.data.pools) {
      console.error('Invalid response from Uniswap subgraph');
      return getFallbackPools();
    }

    const pools = response.data.data.pools;
    
    return pools.map((pool: any) => {
      // Calculate APY based on fees and TVL
      const avgDailyFees = pool.poolDayData.length > 0
        ? pool.poolDayData.reduce((sum: number, day: any) => sum + parseFloat(day.feesUSD), 0) / pool.poolDayData.length
        : 0;
      
      const tvl = parseFloat(pool.totalValueLockedUSD);
      const annualizedFees = avgDailyFees * 365;
      const apy = tvl > 0 ? (annualizedFees / tvl) * 100 : 0;

      // Get 24h volume and fees
      const volume24h = pool.poolDayData[0] ? parseFloat(pool.poolDayData[0].volumeUSD) : 0;
      const fees24h = pool.poolDayData[0] ? parseFloat(pool.poolDayData[0].feesUSD) : 0;

      return {
        protocol: 'Uniswap V3',
        chain: 'ethereum',
        pool: `${pool.token0.symbol}/${pool.token1.symbol}`,
        poolAddress: pool.id,
        apy: parseFloat(apy.toFixed(2)),
        tvl: tvl,
        risk: calculateRisk(apy, tvl),
        impermanentLoss: calculateIL(pool.token0.symbol, pool.token1.symbol),
        token0: pool.token0.symbol,
        token1: pool.token1.symbol,
        fee: pool.feeTier / 10000, // Convert to percentage
        volume24h: volume24h,
        feesEarned24h: fees24h
      };
    }).filter((pool: UniswapYield) => pool.apy > 0); // Filter out pools with 0 APY
  } catch (error) {
    console.error('Error fetching Uniswap yields:', error);
    return getFallbackPools();
  }
}

// Fallback pools if API fails
function getFallbackPools(): UniswapYield[] {
  return [
    {
      protocol: 'Uniswap V3',
      chain: 'ethereum',
      pool: 'ETH/USDC',
      poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      apy: 12.5,
      tvl: 250000000,
      risk: 'low',
      impermanentLoss: 3.5,
      token0: 'ETH',
      token1: 'USDC',
      fee: 0.05,
      volume24h: 50000000,
      feesEarned24h: 25000
    },
    {
      protocol: 'Uniswap V3',
      chain: 'ethereum',
      pool: 'USDC/USDT',
      poolAddress: '0x3416cf6c708da44db2624d63ea0aaef7113527c6',
      apy: 5.2,
      tvl: 120000000,
      risk: 'low',
      impermanentLoss: 0.1,
      token0: 'USDC',
      token1: 'USDT',
      fee: 0.01,
      volume24h: 80000000,
      feesEarned24h: 8000
    }
  ];
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
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo');
    
    // Uniswap V3 NFT Position Manager contract
    const positionManagerAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
    const positionManagerABI = [
      'function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
      'function balanceOf(address owner) view returns (uint256)'
    ];
    
    const positionManager = new ethers.Contract(positionManagerAddress, positionManagerABI, provider);
    
    // Get user's NFT position count
    const balance = await positionManager.balanceOf(userAddress);
    
    if (balance === 0n) {
      return null;
    }
    
    // For simplicity, return data structure (would need to iterate through positions in production)
    return {
      poolAddress,
      userAddress,
      positionCount: balance.toString(),
      message: 'Use Moralis API for detailed position data'
    };
  } catch (error) {
    console.error('Error fetching Uniswap position:', error);
    return null;
  }
}