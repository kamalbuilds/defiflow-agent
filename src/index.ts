import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import type { AppBindings } from './types/hono';

// Import routes
import { yieldRoutes } from './routes/yield';
import { positionsRoutes } from './routes/positions';
import { rebalanceRoutes } from './routes/rebalance';
import { healthRoutes } from './routes/health';

// Import services
import { YieldMonitoringService } from './services/YieldMonitoringService';
import { RebalancingService } from './services/RebalancingService';
import { PositionTrackingService } from './services/PositionTrackingService';

// Load environment variables
dotenv.config();

const app = new Hono<AppBindings>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize services
const yieldMonitoringService = new YieldMonitoringService();
const rebalancingService = new RebalancingService();
const positionTrackingService = new PositionTrackingService();

// Make services available in context
app.use('*', async (c, next) => {
  c.set('yieldMonitoringService', yieldMonitoringService);
  c.set('rebalancingService', rebalancingService);
  c.set('positionTrackingService', positionTrackingService);
  await next();
});

// Routes
app.route('/api/yield', yieldRoutes);
app.route('/api/positions', positionsRoutes);
app.route('/api/rebalance', rebalanceRoutes);
app.route('/', healthRoutes);

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'Route not found' }, 404);
});

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 DeFiFlow Agent starting on port ${port}`);

// Start services
async function startServices() {
  try {
    console.log('🔧 Initializing services...');
    
    await yieldMonitoringService.initialize();
    await positionTrackingService.initialize();
    await rebalancingService.initialize();
    
    console.log('✅ All services initialized successfully');
    
    // Start periodic monitoring
    yieldMonitoringService.startMonitoring();
    positionTrackingService.startTracking();
    
    console.log('📊 Monitoring services started');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  try {
    await yieldMonitoringService.shutdown();
    await positionTrackingService.shutdown();
    await rebalancingService.shutdown();
    
    console.log('✅ Services shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  try {
    await yieldMonitoringService.shutdown();
    await positionTrackingService.shutdown();
    await rebalancingService.shutdown();
    
    console.log('✅ Services shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the application
async function start() {
  await startServices();
  
  serve({
    fetch: app.fetch,
    port,
  });
  
  console.log(`🌟 DeFiFlow Agent is running at http://localhost:${port}`);
}

start().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});