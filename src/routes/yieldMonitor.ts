import { Hono } from 'hono';
import { YieldOpportunity } from '../types/yield';
import { fetchUniswapV3Yields } from '../protocols/ethereum/uniswap';
import { fetchAaveYields } from '../protocols/ethereum/aave';
import { fetchRefFinanceYields } from '../protocols/near/ref';
import { fetchBurrowYields } from '../protocols/near/burrow';
import type { AppBindings } from '../types/hono';

const app = new Hono<AppBindings>();

interface YieldData {
  protocol: string;
  chain: string;
  pool: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  impermanentLoss: number;
}

app.get('/monitor', async (c) => {
  try {
    const opportunities: YieldData[] = [];
    
    // Fetch yields from different protocols in parallel
    const [uniswapYields, aaveYields, refYields, burrowYields] = await Promise.allSettled([
      fetchUniswapV3Yields(),
      fetchAaveYields(),
      fetchRefFinanceYields(),
      fetchBurrowYields()
    ]);
    
    // Process Uniswap yields
    if (uniswapYields.status === 'fulfilled') {
      opportunities.push(...uniswapYields.value);
    }
    
    // Process Aave yields
    if (aaveYields.status === 'fulfilled') {
      opportunities.push(...aaveYields.value);
    }
    
    // Process Ref Finance yields
    if (refYields.status === 'fulfilled') {
      opportunities.push(...refYields.value);
    }
    
    // Process Burrow yields
    if (burrowYields.status === 'fulfilled') {
      opportunities.push(...burrowYields.value);
    }
    
    // Sort by APY descending
    opportunities.sort((a, b) => b.apy - a.apy);
    
    return c.json({
      timestamp: new Date().toISOString(),
      count: opportunities.length,
      opportunities: opportunities.slice(0, 20), // Top 20 opportunities
      bestOpportunity: opportunities[0] || null
    });
  } catch (error) {
    console.error('Error monitoring yields:', error);
    return c.json({ error: 'Failed to monitor yields' }, 500);
  }
});

app.get('/compare', async (c) => {
  try {
    const { protocol1, protocol2 } = c.req.query();
    
    if (!protocol1 || !protocol2) {
      return c.json({ error: 'Please provide protocol1 and protocol2 parameters' }, 400);
    }
    
    // Fetch and compare yields between two protocols
    // This is a simplified comparison - expand based on actual needs
    const comparison = {
      protocol1: {
        name: protocol1,
        avgAPY: 12.5,
        tvl: 1000000,
        risk: 'medium'
      },
      protocol2: {
        name: protocol2,
        avgAPY: 15.2,
        tvl: 500000,
        risk: 'high'
      },
      recommendation: 'Based on risk-adjusted returns, protocol1 offers better stability'
    };
    
    return c.json(comparison);
  } catch (error) {
    console.error('Error comparing yields:', error);
    return c.json({ error: 'Failed to compare yields' }, 500);
  }
});

app.get('/historical', async (c) => {
  try {
    const { protocol, days = '7' } = c.req.query();
    
    // Mock historical data - replace with actual data fetching
    const historicalData = {
      protocol,
      period: `${days} days`,
      data: Array.from({ length: parseInt(days) }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        apy: 10 + Math.random() * 10,
        tvl: 1000000 + Math.random() * 500000
      }))
    };
    
    return c.json(historicalData);
  } catch (error) {
    console.error('Error fetching historical yields:', error);
    return c.json({ error: 'Failed to fetch historical yields' }, 500);
  }
});

export { app as yieldMonitor };