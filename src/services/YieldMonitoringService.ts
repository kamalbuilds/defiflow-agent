import { EventEmitter } from 'events';
import { NearProtocol } from '../protocols/NearProtocol';
import { EthereumProtocol } from '../protocols/EthereumProtocol';
import { BSCProtocol } from '../protocols/BSCProtocol';
import { PolygonProtocol } from '../protocols/PolygonProtocol';
import { logger } from '../utils/logger';
import { CacheManager } from '../utils/CacheManager';

export interface YieldOpportunity {
  id: string;
  protocol: string;
  chain: 'near' | 'ethereum' | 'bsc' | 'polygon';
  poolId: string;
  token: string;
  apy: number;
  tvl: number;
  riskScore: number;
  minDeposit: number;
  maxDeposit?: number;
  lockPeriod?: number;
  fees: {
    deposit: number;
    withdraw: number;
    management: number;
  };
  metadata: {
    poolType: string;
    underlying?: string[];
    leverage?: number;
    autoCompound?: boolean;
  };
  lastUpdated: Date;
}

export interface YieldAlert {
  id: string;
  walletAddress: string;
  minApy: number;
  maxRisk: number;
  protocols?: string[];
  alertMethods: ('email' | 'webhook' | 'push')[];
  isActive: boolean;
  createdAt: Date;
}

export interface MarketConditions {
  timestamp: Date;
  chains: {
    near: {
      gasPrice: number;
      blockTime: number;
      averageApy: number;
      totalTvl: number;
    };
    ethereum: {
      gasPrice: number;
      blockTime: number;
      averageApy: number;
      totalTvl: number;
    };
    bsc: {
      gasPrice: number;
      blockTime: number;
      averageApy: number;
      totalTvl: number;
    };
    polygon: {
      gasPrice: number;
      blockTime: number;
      averageApy: number;
      totalTvl: number;
    };
  };
  defiMetrics: {
    totalValueLocked: number;
    avgYield: number;
    riskIndex: number;
    volatilityIndex: number;
  };
}

export class YieldMonitoringService extends EventEmitter {
  private nearProtocol: NearProtocol;
  private ethereumProtocol: EthereumProtocol;
  private bscProtocol: BSCProtocol;
  private polygonProtocol: PolygonProtocol;
  private cache: CacheManager;
  private monitoringInterval?: NodeJS.Timeout;
  private alerts: Map<string, YieldAlert> = new Map();
  private opportunities: Map<string, YieldOpportunity> = new Map();

  constructor() {
    super();
    this.nearProtocol = new NearProtocol();
    this.ethereumProtocol = new EthereumProtocol();
    this.bscProtocol = new BSCProtocol();
    this.polygonProtocol = new PolygonProtocol();
    this.cache = new CacheManager('yield-monitoring');
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Yield Monitoring Service...');
      
      await this.nearProtocol.initialize();
      await this.ethereumProtocol.initialize();
      await this.bscProtocol.initialize();
      await this.polygonProtocol.initialize();
      
      // Load existing alerts from storage
      await this.loadAlerts();
      
      // Initial fetch of yield opportunities
      await this.refreshYieldOpportunities();
      
      logger.info('Yield Monitoring Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Yield Monitoring Service:', error);
      throw error;
    }
  }

  async startMonitoring(): Promise<void> {
    // Monitor yields every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.refreshYieldOpportunities();
        await this.checkAlerts();
      } catch (error) {
        logger.error('Error in yield monitoring cycle:', error);
      }
    }, 5 * 60 * 1000);

    logger.info('Yield monitoring started');
  }

  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    await this.nearProtocol.shutdown();
    await this.ethereumProtocol.shutdown();
    await this.bscProtocol.shutdown();
    await this.polygonProtocol.shutdown();
    
    logger.info('Yield Monitoring Service shut down');
  }

  async getYieldOpportunities(filters: {
    chain?: string;
    minApy?: number;
    protocol?: string;
  } = {}): Promise<YieldOpportunity[]> {
    const cacheKey = `opportunities:${JSON.stringify(filters)}`;
    const cached = await this.cache.get<YieldOpportunity[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    let opportunities = Array.from(this.opportunities.values());

    // Apply filters
    if (filters.chain) {
      opportunities = opportunities.filter(op => 
        filters.chain === 'all' || op.chain === filters.chain
      );
    }

    if (filters.minApy !== undefined) {
      opportunities = opportunities.filter(op => op.apy >= filters.minApy!);
    }

    if (filters.protocol) {
      opportunities = opportunities.filter(op => 
        op.protocol.toLowerCase().includes(filters.protocol!.toLowerCase())
      );
    }

    // Sort by APY descending
    opportunities.sort((a, b) => b.apy - a.apy);

    await this.cache.set(cacheKey, opportunities, 60); // Cache for 1 minute
    return opportunities;
  }

  async getYieldHistory(protocol: string, poolId: string, days: number): Promise<any[]> {
    const cacheKey = `history:${protocol}:${poolId}:${days}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Fetch historical data from the appropriate protocol
    let history: any[] = [];
    
    try {
      if (protocol.includes('near') || protocol.includes('ref') || protocol.includes('burrow')) {
        history = await this.nearProtocol.getYieldHistory(poolId, days);
      } else {
        history = await this.ethereumProtocol.getYieldHistory(poolId, days);
      }
    } catch (error) {
      logger.error(`Error fetching yield history for ${protocol}:${poolId}:`, error);
      return [];
    }

    await this.cache.set(cacheKey, history, 300); // Cache for 5 minutes
    return history;
  }

  async getYieldAnalytics(chain?: string): Promise<any> {
    const cacheKey = `analytics:${chain || 'all'}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const opportunities = await this.getYieldOpportunities({ chain });
    
    const analytics = {
      totalOpportunities: opportunities.length,
      averageApy: opportunities.reduce((sum, op) => sum + op.apy, 0) / opportunities.length || 0,
      totalTvl: opportunities.reduce((sum, op) => sum + op.tvl, 0),
      riskDistribution: {
        low: opportunities.filter(op => op.riskScore <= 3).length,
        medium: opportunities.filter(op => op.riskScore > 3 && op.riskScore <= 7).length,
        high: opportunities.filter(op => op.riskScore > 7).length,
      },
      protocolBreakdown: opportunities.reduce((acc, op) => {
        acc[op.protocol] = (acc[op.protocol] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      apyRanges: {
        '0-5%': opportunities.filter(op => op.apy <= 5).length,
        '5-15%': opportunities.filter(op => op.apy > 5 && op.apy <= 15).length,
        '15-30%': opportunities.filter(op => op.apy > 15 && op.apy <= 30).length,
        '30%+': opportunities.filter(op => op.apy > 30).length,
      }
    };

    await this.cache.set(cacheKey, analytics, 300); // Cache for 5 minutes
    return analytics;
  }

  async createYieldAlert(alertConfig: Omit<YieldAlert, 'id' | 'isActive' | 'createdAt'>): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const alert: YieldAlert = {
      id: alertId,
      ...alertConfig,
      isActive: true,
      createdAt: new Date()
    };

    this.alerts.set(alertId, alert);
    await this.saveAlerts();

    logger.info(`Created yield alert ${alertId} for wallet ${alert.walletAddress}`);
    return alertId;
  }

  async getMarketConditions(): Promise<MarketConditions> {
    const cacheKey = 'market-conditions';
    const cached = await this.cache.get<MarketConditions>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const [nearConditions, ethConditions, bscConditions, polygonConditions] = await Promise.all([
      this.nearProtocol.getMarketConditions(),
      this.ethereumProtocol.getMarketConditions(),
      this.bscProtocol.getMarketConditions(),
      this.polygonProtocol.getMarketConditions()
    ]);

    const opportunities = await this.getYieldOpportunities();
    
    const conditions: MarketConditions = {
      timestamp: new Date(),
      chains: {
        near: nearConditions,
        ethereum: ethConditions,
        bsc: bscConditions,
        polygon: polygonConditions
      },
      defiMetrics: {
        totalValueLocked: opportunities.reduce((sum, op) => sum + op.tvl, 0),
        avgYield: opportunities.reduce((sum, op) => sum + op.apy, 0) / opportunities.length || 0,
        riskIndex: opportunities.reduce((sum, op) => sum + op.riskScore, 0) / opportunities.length || 0,
        volatilityIndex: this.calculateVolatilityIndex(opportunities)
      }
    };

    await this.cache.set(cacheKey, conditions, 120); // Cache for 2 minutes
    return conditions;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const nearHealth = await this.nearProtocol.healthCheck();
      const ethHealth = await this.ethereumProtocol.healthCheck();
      const opportunitiesCount = this.opportunities.size;
      
      return nearHealth && ethHealth && opportunitiesCount > 0;
    } catch (error) {
      logger.error('Yield monitoring health check failed:', error);
      return false;
    }
  }

  private async refreshYieldOpportunities(): Promise<void> {
    try {
      const [nearOpportunities, ethOpportunities, bscOpportunities, polygonOpportunities] = await Promise.all([
        this.nearProtocol.getYieldOpportunities(),
        this.ethereumProtocol.getYieldOpportunities(),
        this.bscProtocol.getYieldOpportunities(),
        this.polygonProtocol.getYieldOpportunities()
      ]);

      // Clear existing opportunities
      this.opportunities.clear();

      // Add new opportunities
      [...nearOpportunities, ...ethOpportunities, ...bscOpportunities, ...polygonOpportunities].forEach(opportunity => {
        this.opportunities.set(opportunity.id, opportunity);
      });

      this.emit('opportunitiesUpdated', Array.from(this.opportunities.values()));
      
      logger.info(`Refreshed ${this.opportunities.size} yield opportunities`);
    } catch (error) {
      logger.error('Error refreshing yield opportunities:', error);
    }
  }

  private async checkAlerts(): Promise<void> {
    const opportunities = Array.from(this.opportunities.values());
    
    for (const alert of this.alerts.values()) {
      if (!alert.isActive) continue;

      const matchingOpportunities = opportunities.filter(op => {
        const meetsApy = op.apy >= alert.minApy;
        const meetsRisk = op.riskScore <= alert.maxRisk;
        const meetsProtocol = !alert.protocols || alert.protocols.includes(op.protocol);
        
        return meetsApy && meetsRisk && meetsProtocol;
      });

      if (matchingOpportunities.length > 0) {
        await this.triggerAlert(alert, matchingOpportunities);
      }
    }
  }

  private async triggerAlert(alert: YieldAlert, opportunities: YieldOpportunity[]): Promise<void> {
    const alertData = {
      alertId: alert.id,
      walletAddress: alert.walletAddress,
      opportunities: opportunities.slice(0, 5), // Top 5 opportunities
      timestamp: new Date()
    };

    // Emit event for alert processing
    this.emit('yieldAlert', alertData);

    logger.info(`Triggered yield alert ${alert.id} with ${opportunities.length} opportunities`);
  }

  private calculateVolatilityIndex(opportunities: YieldOpportunity[]): number {
    // Simple volatility calculation based on APY distribution
    if (opportunities.length === 0) return 0;
    
    const apys = opportunities.map(op => op.apy);
    const mean = apys.reduce((sum, apy) => sum + apy, 0) / apys.length;
    const variance = apys.reduce((sum, apy) => sum + Math.pow(apy - mean, 2), 0) / apys.length;
    
    return Math.sqrt(variance);
  }

  private async loadAlerts(): Promise<void> {
    // In a real implementation, load from database or persistent storage
    // For now, keep in memory
  }

  private async saveAlerts(): Promise<void> {
    // In a real implementation, save to database or persistent storage
    // For now, keep in memory
  }
}