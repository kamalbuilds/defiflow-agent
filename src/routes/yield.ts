import { Hono } from 'hono';
import { YieldMonitoringService } from '../services/YieldMonitoringService';

const yieldRoutes = new Hono();

// Get all yield opportunities across supported protocols
yieldRoutes.get('/opportunities', async (c) => {
  try {
    const yieldService = c.get('yieldMonitoringService') as YieldMonitoringService;
    const chain = c.req.query('chain'); // 'near', 'ethereum', or 'all'
    const minApy = parseFloat(c.req.query('minApy') || '0');
    const protocol = c.req.query('protocol'); // Optional filter by protocol

    const opportunities = await yieldService.getYieldOpportunities({
      chain,
      minApy,
      protocol
    });

    return c.json({
      success: true,
      data: opportunities,
      metadata: {
        count: opportunities.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching yield opportunities:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch yield opportunities',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get historical yield data for a specific protocol/pool
yieldRoutes.get('/history/:protocol/:poolId', async (c) => {
  try {
    const yieldService = c.get('yieldMonitoringService') as YieldMonitoringService;
    const { protocol, poolId } = c.req.param();
    const days = parseInt(c.req.query('days') || '30');

    const history = await yieldService.getYieldHistory(protocol, poolId, days);

    return c.json({
      success: true,
      data: history,
      metadata: {
        protocol,
        poolId,
        days,
        dataPoints: history.length
      }
    });
  } catch (error) {
    console.error('Error fetching yield history:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch yield history',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get yield analytics and insights
yieldRoutes.get('/analytics', async (c) => {
  try {
    const yieldService = c.get('yieldMonitoringService') as YieldMonitoringService;
    const chain = c.req.query('chain');

    const analytics = await yieldService.getYieldAnalytics(chain);

    return c.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching yield analytics:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch yield analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Subscribe to yield alerts
yieldRoutes.post('/alerts', async (c) => {
  try {
    const yieldService = c.get('yieldMonitoringService') as YieldMonitoringService;
    const body = await c.req.json();
    
    const { 
      walletAddress,
      minApy,
      maxRisk,
      protocols,
      alertMethods 
    } = body;

    const alertId = await yieldService.createYieldAlert({
      walletAddress,
      minApy,
      maxRisk,
      protocols,
      alertMethods
    });

    return c.json({
      success: true,
      data: { alertId },
      message: 'Yield alert created successfully'
    });
  } catch (error) {
    console.error('Error creating yield alert:', error);
    return c.json({
      success: false,
      error: 'Failed to create yield alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get current market conditions affecting yields
yieldRoutes.get('/market-conditions', async (c) => {
  try {
    const yieldService = c.get('yieldMonitoringService') as YieldMonitoringService;
    
    const conditions = await yieldService.getMarketConditions();

    return c.json({
      success: true,
      data: conditions
    });
  } catch (error) {
    console.error('Error fetching market conditions:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch market conditions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { yieldRoutes };