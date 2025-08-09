import { Hono } from 'hono';
import type { AppBindings } from '../types/hono';

const healthRoutes = new Hono<AppBindings>();

healthRoutes.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DeFiFlow Agent',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  });
});

healthRoutes.get('/health/deep', async (c) => {
  const yieldService = c.get('yieldMonitoringService');
  const positionService = c.get('positionTrackingService');
  const rebalanceService = c.get('rebalancingService');

  try {
    const checks = await Promise.allSettled([
      yieldService?.healthCheck?.() || Promise.resolve(true),
      positionService?.healthCheck?.() || Promise.resolve(true),
      rebalanceService?.healthCheck?.() || Promise.resolve(true),
    ]);

    const allHealthy = checks.every(check => 
      check.status === 'fulfilled' && check.value === true
    );

    return c.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'DeFiFlow Agent',
      checks: {
        yieldMonitoring: checks[0].status === 'fulfilled' ? checks[0].value : false,
        positionTracking: checks[1].status === 'fulfilled' ? checks[1].value : false,
        rebalancing: checks[2].status === 'fulfilled' ? checks[2].value : false,
      }
    }, allHealthy ? 200 : 503);
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 503);
  }
});

export { healthRoutes };