import { Hono } from 'hono';
import { RebalancingService } from '../services/RebalancingService';

const rebalanceRoutes = new Hono();

// Get rebalancing recommendations for a wallet
rebalanceRoutes.get('/recommendations/:walletAddress', async (c) => {
  try {
    const rebalanceService = c.get('rebalancingService') as RebalancingService;
    const { walletAddress } = c.req.param();
    const strategy = c.req.query('strategy') || 'yield_optimization';

    const recommendations = await rebalanceService.getRebalanceRecommendations(
      walletAddress,
      strategy as any
    );

    return c.json({
      success: true,
      data: recommendations,
      metadata: {
        walletAddress,
        strategy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting rebalance recommendations:', error);
    return c.json({
      success: false,
      error: 'Failed to get rebalance recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Execute a rebalancing strategy
rebalanceRoutes.post('/execute', async (c) => {
  try {
    const rebalanceService = c.get('rebalancingService') as RebalancingService;
    const body = await c.req.json();

    const {
      walletAddress,
      strategy,
      actions,
      slippage = 0.01,
      gasPrice,
      dryRun = false
    } = body;

    const result = await rebalanceService.executeRebalance({
      walletAddress,
      strategy,
      actions,
      slippage,
      gasPrice,
      dryRun
    });

    return c.json({
      success: true,
      data: result,
      message: dryRun ? 'Dry run completed' : 'Rebalance executed'
    });
  } catch (error) {
    console.error('Error executing rebalance:', error);
    return c.json({
      success: false,
      error: 'Failed to execute rebalance',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get rebalancing history for a wallet
rebalanceRoutes.get('/history/:walletAddress', async (c) => {
  try {
    const rebalanceService = c.get('rebalancingService') as RebalancingService;
    const { walletAddress } = c.req.param();
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const history = await rebalanceService.getRebalanceHistory(walletAddress, limit, offset);

    return c.json({
      success: true,
      data: history,
      metadata: {
        walletAddress,
        limit,
        offset,
        count: history.length
      }
    });
  } catch (error) {
    console.error('Error fetching rebalance history:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch rebalance history',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get available rebalancing strategies
rebalanceRoutes.get('/strategies', async (c) => {
  try {
    const rebalanceService = c.get('rebalancingService') as RebalancingService;
    
    const strategies = await rebalanceService.getAvailableStrategies();

    return c.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch strategies',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Simulate a rebalancing strategy
rebalanceRoutes.post('/simulate', async (c) => {
  try {
    const rebalanceService = c.get('rebalancingService') as RebalancingService;
    const body = await c.req.json();

    const {
      walletAddress,
      strategy,
      targetAllocations,
      timeHorizon = 30 // days
    } = body;

    const simulation = await rebalanceService.simulateRebalance({
      walletAddress,
      strategy,
      targetAllocations,
      timeHorizon
    });

    return c.json({
      success: true,
      data: simulation
    });
  } catch (error) {
    console.error('Error running simulation:', error);
    return c.json({
      success: false,
      error: 'Failed to run simulation',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Set up automatic rebalancing
rebalanceRoutes.post('/auto-setup', async (c) => {
  try {
    const rebalanceService = c.get('rebalancingService') as RebalancingService;
    const body = await c.req.json();

    const {
      walletAddress,
      strategy,
      triggers,
      maxSlippage,
      gasLimit,
      enabled = true
    } = body;

    const autoRebalanceId = await rebalanceService.setupAutoRebalance({
      walletAddress,
      strategy,
      triggers,
      maxSlippage,
      gasLimit,
      enabled
    });

    return c.json({
      success: true,
      data: { autoRebalanceId },
      message: 'Auto-rebalancing setup completed'
    });
  } catch (error) {
    console.error('Error setting up auto-rebalancing:', error);
    return c.json({
      success: false,
      error: 'Failed to setup auto-rebalancing',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get auto-rebalancing status
rebalanceRoutes.get('/auto-status/:walletAddress', async (c) => {
  try {
    const rebalanceService = c.get('rebalancingService') as RebalancingService;
    const { walletAddress } = c.req.param();

    const status = await rebalanceService.getAutoRebalanceStatus(walletAddress);

    return c.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting auto-rebalance status:', error);
    return c.json({
      success: false,
      error: 'Failed to get auto-rebalance status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update auto-rebalancing settings
rebalanceRoutes.put('/auto-settings/:walletAddress', async (c) => {
  try {
    const rebalanceService = c.get('rebalancingService') as RebalancingService;
    const { walletAddress } = c.req.param();
    const settings = await c.req.json();

    await rebalanceService.updateAutoRebalanceSettings(walletAddress, settings);

    return c.json({
      success: true,
      message: 'Auto-rebalancing settings updated'
    });
  } catch (error) {
    console.error('Error updating auto-rebalance settings:', error);
    return c.json({
      success: false,
      error: 'Failed to update auto-rebalance settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { rebalanceRoutes };