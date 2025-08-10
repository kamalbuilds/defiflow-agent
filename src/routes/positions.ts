import { Hono } from 'hono';
import { PositionTrackingService } from '../services/PositionTrackingService';
import type { AppBindings } from '../types/hono';

const positionsRoutes = new Hono<AppBindings>();

// Get all positions (demo endpoint without wallet)
positionsRoutes.get('/', async (c) => {
  try {
    const positionService = c.get('positionTrackingService') as PositionTrackingService;
    
    // For demo, return mock positions or empty array
    const mockPositions = [
      {
        id: 'pos_1',
        walletAddress: 'demo.near',
        protocol: 'Ref Finance',
        chain: 'near',
        tokenSymbol: 'NEAR',
        amount: 100,
        value: 350,
        apy: 12.5,
        riskScore: 4
      },
      {
        id: 'pos_2',
        walletAddress: 'demo.near',
        protocol: 'Uniswap V3',
        chain: 'ethereum',
        tokenSymbol: 'ETH',
        amount: 0.5,
        value: 1200,
        apy: 8.2,
        riskScore: 5
      }
    ];

    return c.json({
      success: true,
      positions: mockPositions,
      metadata: {
        totalValue: mockPositions.reduce((sum, p) => sum + p.value, 0),
        averageApy: mockPositions.reduce((sum, p) => sum + p.apy, 0) / mockPositions.length
      }
    });
  } catch (error) {
    console.error('Error getting positions:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch positions',
      positions: []
    }, 500);
  }
});

// Get all positions for a wallet across chains
positionsRoutes.get('/:walletAddress', async (c) => {
  try {
    const positionService = c.get('positionTrackingService') as PositionTrackingService;
    const { walletAddress } = c.req.param();
    const chain = c.req.query('chain'); // Optional filter by chain

    const positions = await positionService.getPositions(walletAddress, chain);

    return c.json({
      success: true,
      data: positions,
      metadata: {
        walletAddress,
        totalPositions: positions.length,
        chains: [...new Set(positions.map(p => p.chain))],
        totalValue: positions.reduce((sum, p) => sum + p.value, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch positions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get detailed information about a specific position
positionsRoutes.get('/:walletAddress/:positionId', async (c) => {
  try {
    const positionService = c.get('positionTrackingService') as PositionTrackingService;
    const { walletAddress, positionId } = c.req.param();

    const position = await positionService.getPositionDetails(walletAddress, positionId);

    if (!position) {
      return c.json({
        success: false,
        error: 'Position not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: position
    });
  } catch (error) {
    console.error('Error fetching position details:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch position details',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get position history and performance
positionsRoutes.get('/:walletAddress/:positionId/history', async (c) => {
  try {
    const positionService = c.get('positionTrackingService') as PositionTrackingService;
    const { walletAddress, positionId } = c.req.param();
    const days = parseInt(c.req.query('days') || '30');

    const history = await positionService.getPositionHistory(walletAddress, positionId, days);

    return c.json({
      success: true,
      data: history,
      metadata: {
        positionId,
        days,
        dataPoints: history.length
      }
    });
  } catch (error) {
    console.error('Error fetching position history:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch position history',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get portfolio summary across all chains
positionsRoutes.get('/:walletAddress/portfolio', async (c) => {
  try {
    const positionService = c.get('positionTrackingService') as PositionTrackingService;
    const { walletAddress } = c.req.param();

    const portfolio = await positionService.getPortfolioSummary(walletAddress);

    return c.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch portfolio summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Track a new position
positionsRoutes.post('/track', async (c) => {
  try {
    const positionService = c.get('positionTrackingService') as PositionTrackingService;
    const body = await c.req.json();

    const {
      walletAddress,
      chain,
      protocol,
      positionType,
      tokenAddress,
      amount,
      metadata
    } = body;

    const positionId = await positionService.trackPosition({
      walletAddress,
      chain,
      protocol,
      positionType,
      tokenAddress,
      amount,
      metadata
    });

    return c.json({
      success: true,
      data: { positionId },
      message: 'Position tracking started'
    });
  } catch (error) {
    console.error('Error tracking position:', error);
    return c.json({
      success: false,
      error: 'Failed to track position',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Stop tracking a position
positionsRoutes.delete('/:walletAddress/:positionId', async (c) => {
  try {
    const positionService = c.get('positionTrackingService') as PositionTrackingService;
    const { walletAddress, positionId } = c.req.param();

    await positionService.stopTracking(walletAddress, positionId);

    return c.json({
      success: true,
      message: 'Position tracking stopped'
    });
  } catch (error) {
    console.error('Error stopping position tracking:', error);
    return c.json({
      success: false,
      error: 'Failed to stop position tracking',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get position risk analysis
positionsRoutes.get('/:walletAddress/:positionId/risk', async (c) => {
  try {
    const positionService = c.get('positionTrackingService') as PositionTrackingService;
    const { walletAddress, positionId } = c.req.param();

    const riskAnalysis = await positionService.getRiskAnalysis(walletAddress, positionId);

    return c.json({
      success: true,
      data: riskAnalysis
    });
  } catch (error) {
    console.error('Error getting risk analysis:', error);
    return c.json({
      success: false,
      error: 'Failed to get risk analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { positionsRoutes };