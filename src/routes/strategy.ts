import { Hono } from 'hono';
import type { AppBindings } from '../types/hono';

const app = new Hono<AppBindings>();

interface StrategyConfig {
  name: string;
  riskTolerance: 'low' | 'medium' | 'high';
  minAPY: number;
  maxImpermanentLoss: number;
  preferredChains: string[];
  preferredProtocols: string[];
  rebalanceThreshold: number;
  gasOptimization: boolean;
}

app.get('/current', async (c) => {
  try {
    // Get current strategy configuration
    const currentStrategy: StrategyConfig = {
      name: 'Balanced Yield Optimizer',
      riskTolerance: 'medium',
      minAPY: 10,
      maxImpermanentLoss: 5,
      preferredChains: ['ethereum', 'near', 'polygon'],
      preferredProtocols: ['Uniswap V3', 'Aave V3', 'Ref Finance'],
      rebalanceThreshold: 2, // 2% APY difference triggers rebalance
      gasOptimization: true
    };
    
    return c.json({
      strategy: currentStrategy,
      active: true,
      lastUpdated: new Date(Date.now() - 86400000).toISOString(),
      performance: {
        totalRebalances: 12,
        successRate: 91.7,
        avgYieldIncrease: 3.4
      }
    });
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return c.json({ error: 'Failed to fetch strategy' }, 500);
  }
});

app.post('/configure', async (c) => {
  try {
    const body = await c.req.json<Partial<StrategyConfig>>();
    
    // Validate configuration
    if (body.minAPY && body.minAPY < 0) {
      return c.json({ error: 'Minimum APY must be positive' }, 400);
    }
    
    if (body.maxImpermanentLoss && (body.maxImpermanentLoss < 0 || body.maxImpermanentLoss > 100)) {
      return c.json({ error: 'Max IL must be between 0 and 100' }, 400);
    }
    
    console.log('Updating strategy configuration:', body);
    
    return c.json({
      status: 'success',
      message: 'Strategy configuration updated',
      updates: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error configuring strategy:', error);
    return c.json({ error: 'Failed to configure strategy' }, 500);
  }
});

app.get('/templates', async (c) => {
  try {
    // Pre-configured strategy templates
    const templates = [
      {
        id: 'conservative',
        name: 'Conservative Yield',
        description: 'Focus on stable yields with minimal risk',
        config: {
          riskTolerance: 'low',
          minAPY: 5,
          maxImpermanentLoss: 2,
          preferredProtocols: ['Aave', 'Compound'],
          gasOptimization: true
        }
      },
      {
        id: 'aggressive',
        name: 'Aggressive Growth',
        description: 'Maximize yields with higher risk tolerance',
        config: {
          riskTolerance: 'high',
          minAPY: 15,
          maxImpermanentLoss: 10,
          preferredProtocols: ['Uniswap V3', 'PancakeSwap'],
          gasOptimization: false
        }
      },
      {
        id: 'stablecoin',
        name: 'Stablecoin Farming',
        description: 'Optimize stablecoin yields with minimal IL',
        config: {
          riskTolerance: 'low',
          minAPY: 8,
          maxImpermanentLoss: 0.5,
          preferredProtocols: ['Curve', 'Aave'],
          gasOptimization: true
        }
      }
    ];
    
    return c.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return c.json({ error: 'Failed to fetch templates' }, 500);
  }
});

app.post('/apply-template/:templateId', async (c) => {
  try {
    const { templateId } = c.req.param();
    
    console.log(`Applying strategy template: ${templateId}`);
    
    return c.json({
      status: 'success',
      message: `Template ${templateId} applied successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error applying template:', error);
    return c.json({ error: 'Failed to apply template' }, 500);
  }
});

app.get('/backtest', async (c) => {
  try {
    const { strategy, period = '30' } = c.req.query();
    
    // Mock backtest results
    const backtestResults = {
      strategy: strategy || 'current',
      period: `${period} days`,
      results: {
        totalReturn: 1234.56,
        percentageReturn: 12.35,
        sharpeRatio: 1.45,
        maxDrawdown: -5.2,
        winRate: 73.5,
        totalTrades: 23,
        profitableTrades: 17,
        avgProfit: 89.23,
        avgLoss: -34.12
      },
      chartData: Array.from({ length: parseInt(period) }, (_, i) => ({
        day: i + 1,
        value: 10000 + Math.random() * 2000 - 500
      }))
    };
    
    return c.json(backtestResults);
  } catch (error) {
    console.error('Error running backtest:', error);
    return c.json({ error: 'Failed to run backtest' }, 500);
  }
});

export { app as strategy };