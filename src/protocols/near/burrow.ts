export interface BurrowYield {
  protocol: string;
  chain: string;
  pool: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  impermanentLoss: number;
  asset: string;
  type: 'supply' | 'borrow';
  utilization: number;
}

export async function fetchBurrowYields(): Promise<BurrowYield[]> {
  try {
    // Mock Burrow lending data - replace with actual Burrow API calls
    const markets = [
      {
        asset: 'NEAR',
        supplyAPY: 6.5,
        borrowAPY: 9.2,
        totalSupply: 1000000,
        totalBorrow: 650000,
        utilization: 65
      },
      {
        asset: 'USDT',
        supplyAPY: 9.8,
        borrowAPY: 12.5,
        totalSupply: 5000000,
        totalBorrow: 4000000,
        utilization: 80
      },
      {
        asset: 'USDC',
        supplyAPY: 9.2,
        borrowAPY: 11.8,
        totalSupply: 4500000,
        totalBorrow: 3500000,
        utilization: 78
      },
      {
        asset: 'wBTC',
        supplyAPY: 3.5,
        borrowAPY: 5.2,
        totalSupply: 50,
        totalBorrow: 30,
        utilization: 60
      }
    ];
    
    const yields: BurrowYield[] = [];
    
    markets.forEach(market => {
      yields.push({
        protocol: 'Burrow',
        chain: 'near',
        pool: `${market.asset} Supply`,
        apy: market.supplyAPY,
        tvl: market.totalSupply,
        risk: calculateRisk(market.utilization),
        impermanentLoss: 0,
        asset: market.asset,
        type: 'supply',
        utilization: market.utilization
      });
    });
    
    return yields;
  } catch (error) {
    console.error('Error fetching Burrow yields:', error);
    return [];
  }
}

function calculateRisk(utilization: number): 'low' | 'medium' | 'high' {
  if (utilization < 60) return 'low';
  if (utilization < 80) return 'medium';
  return 'high';
}

export async function getBurrowUserData(accountId: string) {
  try {
    // Mock Burrow user position data
    return {
      accountId,
      supplied: [
        {
          asset: 'NEAR',
          amount: '1000',
          apy: 6.5,
          value: '5000'
        },
        {
          asset: 'USDT',
          amount: '2000',
          apy: 9.8,
          value: '2000'
        }
      ],
      borrowed: [
        {
          asset: 'USDC',
          amount: '1000',
          apy: 11.8,
          value: '1000'
        }
      ],
      totalSuppliedValue: '7000',
      totalBorrowedValue: '1000',
      healthFactor: 3.5,
      netAPY: 7.2
    };
  } catch (error) {
    console.error('Error fetching Burrow user data:', error);
    return null;
  }
}

export async function calculateBurrowRewards(accountId: string) {
  try {
    // Calculate BRRR token rewards
    return {
      pendingBRRR: '125.5',
      claimable: true,
      nextRewardTime: new Date(Date.now() + 3600000).toISOString(),
      apr: 15.2
    };
  } catch (error) {
    console.error('Error calculating Burrow rewards:', error);
    return null;
  }
}