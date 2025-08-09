import { EventEmitter } from 'events';
import { NearProtocol } from '../protocols/NearProtocol';
import { EthereumProtocol } from '../protocols/EthereumProtocol';
import { logger } from '../utils/logger';
import { CacheManager } from '../utils/CacheManager';

export interface Position {
  id: string;
  walletAddress: string;
  chain: 'near' | 'ethereum';
  protocol: string;
  positionType: 'lending' | 'liquidity' | 'staking' | 'farming';
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  value: number; // USD value
  apy: number;
  rewards?: {
    token: string;
    amount: number;
    value: number;
  }[];
  riskScore: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  lockPeriod?: number;
  unlockDate?: Date;
  lastUpdated: Date;
  metadata: {
    poolId?: string;
    leverage?: number;
    collateralRatio?: number;
    liquidationPrice?: number;
    fees?: {
      entry: number;
      exit: number;
      management: number;
    };
  };
}

export interface PortfolioSummary {
  walletAddress: string;
  totalValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
  positionCount: number;
  chainDistribution: Record<string, { value: number; percentage: number }>;
  protocolDistribution: Record<string, { value: number; percentage: number }>;
  riskBreakdown: {
    low: { count: number; value: number };
    medium: { count: number; value: number };
    high: { count: number; value: number };
  };
  yieldMetrics: {
    averageApy: number;
    totalYieldEarned: number;
    projectedMonthlyYield: number;
  };
  lastUpdated: Date;
}

export interface PositionHistory {
  positionId: string;
  timestamp: Date;
  value: number;
  apy: number;
  pnl: number;
  rewards?: number;
}

export interface RiskAnalysis {
  positionId: string;
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number;
  factors: {
    protocolRisk: number;
    marketRisk: number;
    liquidityRisk: number;
    concentrationRisk: number;
  };
  recommendations: string[];
  alerts: string[];
}

export class PositionTrackingService extends EventEmitter {
  private nearProtocol: NearProtocol;
  private ethereumProtocol: EthereumProtocol;
  private cache: CacheManager;
  private trackingInterval?: NodeJS.Timeout;
  private positions: Map<string, Position[]> = new Map(); // walletAddress -> positions

  constructor() {
    super();
    this.nearProtocol = new NearProtocol();
    this.ethereumProtocol = new EthereumProtocol();
    this.cache = new CacheManager('position-tracking');
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Position Tracking Service...');
      
      await this.nearProtocol.initialize();
      await this.ethereumProtocol.initialize();
      
      // Load existing positions from storage
      await this.loadPositions();
      
      logger.info('Position Tracking Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Position Tracking Service:', error);
      throw error;
    }
  }

  async startTracking(): Promise<void> {
    // Update positions every 2 minutes
    this.trackingInterval = setInterval(async () => {
      try {
        await this.updateAllPositions();
      } catch (error) {
        logger.error('Error in position tracking cycle:', error);
      }
    }, 2 * 60 * 1000);

    logger.info('Position tracking started');
  }

  async shutdown(): Promise<void> {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    
    await this.nearProtocol.shutdown();
    await this.ethereumProtocol.shutdown();
    
    logger.info('Position Tracking Service shut down');
  }

  async getPositions(walletAddress: string, chain?: string): Promise<Position[]> {
    const cacheKey = `positions:${walletAddress}:${chain || 'all'}`;
    const cached = await this.cache.get<Position[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    let positions = this.positions.get(walletAddress) || [];

    if (chain) {
      positions = positions.filter(pos => pos.chain === chain);
    }

    // Sort by value descending
    positions.sort((a, b) => b.value - a.value);

    await this.cache.set(cacheKey, positions, 30); // Cache for 30 seconds
    return positions;
  }

  async getPositionDetails(walletAddress: string, positionId: string): Promise<Position | null> {
    const positions = await this.getPositions(walletAddress);
    return positions.find(pos => pos.id === positionId) || null;
  }

  async getPositionHistory(walletAddress: string, positionId: string, days: number): Promise<PositionHistory[]> {
    const cacheKey = `history:${walletAddress}:${positionId}:${days}`;
    const cached = await this.cache.get<PositionHistory[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // In a real implementation, fetch from database
    // For now, generate mock historical data
    const history: PositionHistory[] = [];
    const position = await this.getPositionDetails(walletAddress, positionId);
    
    if (!position) {
      return [];
    }

    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Generate realistic historical data with some randomness
      const valueVariation = 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
      const apyVariation = 1 + (Math.random() - 0.5) * 0.2; // ±10% variation
      
      history.push({
        positionId,
        timestamp,
        value: position.value * valueVariation,
        apy: position.apy * apyVariation,
        pnl: position.pnl * valueVariation,
        rewards: position.rewards?.reduce((sum, r) => sum + r.value, 0) * valueVariation || 0
      });
    }

    await this.cache.set(cacheKey, history, 300); // Cache for 5 minutes
    return history;
  }

  async getPortfolioSummary(walletAddress: string): Promise<PortfolioSummary> {
    const cacheKey = `portfolio:${walletAddress}`;
    const cached = await this.cache.get<PortfolioSummary>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const positions = await this.getPositions(walletAddress);
    
    if (positions.length === 0) {
      return {
        walletAddress,
        totalValue: 0,
        totalPnl: 0,
        totalPnlPercentage: 0,
        positionCount: 0,
        chainDistribution: {},
        protocolDistribution: {},
        riskBreakdown: { low: { count: 0, value: 0 }, medium: { count: 0, value: 0 }, high: { count: 0, value: 0 } },
        yieldMetrics: { averageApy: 0, totalYieldEarned: 0, projectedMonthlyYield: 0 },
        lastUpdated: new Date()
      };
    }

    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
    
    // Chain distribution
    const chainDistribution: Record<string, { value: number; percentage: number }> = {};
    positions.forEach(pos => {
      if (!chainDistribution[pos.chain]) {
        chainDistribution[pos.chain] = { value: 0, percentage: 0 };
      }
      chainDistribution[pos.chain].value += pos.value;
    });
    Object.keys(chainDistribution).forEach(chain => {
      chainDistribution[chain].percentage = (chainDistribution[chain].value / totalValue) * 100;
    });

    // Protocol distribution
    const protocolDistribution: Record<string, { value: number; percentage: number }> = {};
    positions.forEach(pos => {
      if (!protocolDistribution[pos.protocol]) {
        protocolDistribution[pos.protocol] = { value: 0, percentage: 0 };
      }
      protocolDistribution[pos.protocol].value += pos.value;
    });
    Object.keys(protocolDistribution).forEach(protocol => {
      protocolDistribution[protocol].percentage = (protocolDistribution[protocol].value / totalValue) * 100;
    });

    // Risk breakdown
    const riskBreakdown = {
      low: { count: 0, value: 0 },
      medium: { count: 0, value: 0 },
      high: { count: 0, value: 0 }
    };
    positions.forEach(pos => {
      const risk = pos.riskScore <= 3 ? 'low' : pos.riskScore <= 7 ? 'medium' : 'high';
      riskBreakdown[risk].count++;
      riskBreakdown[risk].value += pos.value;
    });

    const summary: PortfolioSummary = {
      walletAddress,
      totalValue,
      totalPnl,
      totalPnlPercentage: totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0,
      positionCount: positions.length,
      chainDistribution,
      protocolDistribution,
      riskBreakdown,
      yieldMetrics: {
        averageApy: positions.reduce((sum, pos) => sum + pos.apy, 0) / positions.length,
        totalYieldEarned: positions.reduce((sum, pos) => sum + (pos.rewards?.reduce((r, reward) => r + reward.value, 0) || 0), 0),
        projectedMonthlyYield: positions.reduce((sum, pos) => sum + (pos.value * pos.apy / 100 / 12), 0)
      },
      lastUpdated: new Date()
    };

    await this.cache.set(cacheKey, summary, 60); // Cache for 1 minute
    return summary;
  }

  async trackPosition(positionConfig: {
    walletAddress: string;
    chain: 'near' | 'ethereum';
    protocol: string;
    positionType: 'lending' | 'liquidity' | 'staking' | 'farming';
    tokenAddress: string;
    amount: number;
    metadata?: any;
  }): Promise<string> {
    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Fetch current position data from blockchain
      const protocolHandler = positionConfig.chain === 'near' ? this.nearProtocol : this.ethereumProtocol;
      const positionData = await protocolHandler.getPositionData(
        positionConfig.tokenAddress,
        positionConfig.walletAddress
      );

      const position: Position = {
        id: positionId,
        ...positionConfig,
        tokenSymbol: positionData.symbol || 'UNKNOWN',
        value: positionData.value || 0,
        apy: positionData.apy || 0,
        riskScore: positionData.riskScore || 5,
        entryPrice: positionData.currentPrice || 0,
        currentPrice: positionData.currentPrice || 0,
        pnl: 0,
        pnlPercentage: 0,
        lastUpdated: new Date(),
        metadata: {
          ...positionConfig.metadata,
          ...positionData.metadata
        }
      };

      const walletPositions = this.positions.get(positionConfig.walletAddress) || [];
      walletPositions.push(position);
      this.positions.set(positionConfig.walletAddress, walletPositions);

      await this.savePositions();
      
      this.emit('positionTracked', position);
      logger.info(`Started tracking position ${positionId} for wallet ${positionConfig.walletAddress}`);
      
      return positionId;
    } catch (error) {
      logger.error(`Error tracking position for ${positionConfig.walletAddress}:`, error);
      throw error;
    }
  }

  async stopTracking(walletAddress: string, positionId: string): Promise<void> {
    const walletPositions = this.positions.get(walletAddress) || [];
    const updatedPositions = walletPositions.filter(pos => pos.id !== positionId);
    
    if (updatedPositions.length === walletPositions.length) {
      throw new Error('Position not found');
    }

    this.positions.set(walletAddress, updatedPositions);
    await this.savePositions();
    
    this.emit('positionStopped', { walletAddress, positionId });
    logger.info(`Stopped tracking position ${positionId} for wallet ${walletAddress}`);
  }

  async getRiskAnalysis(walletAddress: string, positionId: string): Promise<RiskAnalysis> {
    const position = await this.getPositionDetails(walletAddress, positionId);
    
    if (!position) {
      throw new Error('Position not found');
    }

    const analysis: RiskAnalysis = {
      positionId,
      overallRisk: position.riskScore <= 3 ? 'low' : position.riskScore <= 7 ? 'medium' : 'high',
      riskScore: position.riskScore,
      factors: {
        protocolRisk: this.calculateProtocolRisk(position.protocol),
        marketRisk: this.calculateMarketRisk(position.tokenSymbol),
        liquidityRisk: this.calculateLiquidityRisk(position),
        concentrationRisk: await this.calculateConcentrationRisk(walletAddress, position)
      },
      recommendations: this.generateRecommendations(position),
      alerts: this.generateAlerts(position)
    };

    return analysis;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const nearHealth = await this.nearProtocol.healthCheck();
      const ethHealth = await this.ethereumProtocol.healthCheck();
      const totalPositions = Array.from(this.positions.values()).reduce((sum, positions) => sum + positions.length, 0);
      
      return nearHealth && ethHealth && totalPositions >= 0; // Allow 0 positions
    } catch (error) {
      logger.error('Position tracking health check failed:', error);
      return false;
    }
  }

  private async updateAllPositions(): Promise<void> {
    const updatePromises: Promise<void>[] = [];
    
    for (const [walletAddress, positions] of this.positions.entries()) {
      for (const position of positions) {
        updatePromises.push(this.updatePosition(walletAddress, position));
      }
    }

    try {
      await Promise.allSettled(updatePromises);
      await this.savePositions();
      
      this.emit('positionsUpdated', new Date());
      logger.info(`Updated ${updatePromises.length} positions`);
    } catch (error) {
      logger.error('Error updating positions:', error);
    }
  }

  private async updatePosition(walletAddress: string, position: Position): Promise<void> {
    try {
      const protocolHandler = position.chain === 'near' ? this.nearProtocol : this.ethereumProtocol;
      const updatedData = await protocolHandler.getPositionData(
        position.tokenAddress,
        walletAddress
      );

      // Update position with new data
      position.amount = updatedData.amount || position.amount;
      position.value = updatedData.value || position.value;
      position.currentPrice = updatedData.currentPrice || position.currentPrice;
      position.apy = updatedData.apy || position.apy;
      position.rewards = updatedData.rewards || position.rewards;
      
      // Calculate PnL
      const totalInvested = position.amount * position.entryPrice;
      const currentValue = position.amount * position.currentPrice;
      position.pnl = currentValue - totalInvested;
      position.pnlPercentage = totalInvested > 0 ? (position.pnl / totalInvested) * 100 : 0;
      
      position.lastUpdated = new Date();

      // Check for significant changes and emit events
      if (Math.abs(position.pnlPercentage) > 10) {
        this.emit('significantPnlChange', { walletAddress, position });
      }
    } catch (error) {
      logger.error(`Error updating position ${position.id}:`, error);
    }
  }

  private calculateProtocolRisk(protocol: string): number {
    // Simple protocol risk scoring
    const riskScores: Record<string, number> = {
      'aave': 2,
      'compound': 2,
      'uniswap': 3,
      'ref-finance': 4,
      'burrow': 5,
      'aurora': 4,
      'trisolaris': 6
    };
    
    return riskScores[protocol.toLowerCase()] || 7;
  }

  private calculateMarketRisk(tokenSymbol: string): number {
    // Simple market risk based on token volatility
    const stableCoins = ['USDC', 'USDT', 'DAI', 'USN'];
    const bluechips = ['ETH', 'BTC', 'NEAR'];
    
    if (stableCoins.includes(tokenSymbol.toUpperCase())) return 1;
    if (bluechips.includes(tokenSymbol.toUpperCase())) return 3;
    return 7; // Alt coins higher risk
  }

  private calculateLiquidityRisk(position: Position): number {
    // Simple liquidity risk based on position value and lock period
    let risk = 3; // Base risk
    
    if (position.lockPeriod && position.lockPeriod > 30) {
      risk += 2; // Locked positions are riskier
    }
    
    if (position.value < 1000) {
      risk += 1; // Small positions harder to liquidate
    }
    
    return Math.min(risk, 10);
  }

  private async calculateConcentrationRisk(walletAddress: string, position: Position): Promise<number> {
    const portfolio = await this.getPortfolioSummary(walletAddress);
    const positionPercentage = portfolio.totalValue > 0 ? (position.value / portfolio.totalValue) * 100 : 0;
    
    if (positionPercentage > 50) return 9;
    if (positionPercentage > 25) return 6;
    if (positionPercentage > 10) return 3;
    return 1;
  }

  private generateRecommendations(position: Position): string[] {
    const recommendations: string[] = [];
    
    if (position.riskScore > 7) {
      recommendations.push('Consider reducing exposure to this high-risk position');
    }
    
    if (position.pnlPercentage < -20) {
      recommendations.push('Position has significant unrealized losses - consider exit strategy');
    }
    
    if (position.apy < 3) {
      recommendations.push('Low yield - consider alternative opportunities');
    }
    
    return recommendations;
  }

  private generateAlerts(position: Position): string[] {
    const alerts: string[] = [];
    
    if (position.metadata.liquidationPrice && position.currentPrice <= position.metadata.liquidationPrice * 1.1) {
      alerts.push('Position at risk of liquidation');
    }
    
    if (position.unlockDate && position.unlockDate.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
      alerts.push('Position unlock period ending soon');
    }
    
    return alerts;
  }

  private async loadPositions(): Promise<void> {
    // In a real implementation, load from database
    // For now, keep in memory
  }

  private async savePositions(): Promise<void> {
    // In a real implementation, save to database
    // For now, keep in memory
  }
}