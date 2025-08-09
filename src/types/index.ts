/**
 * Shared type definitions for DeFiFlow Agent
 */

export interface Chain {
  id: string;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chain: string;
}

export interface Protocol {
  id: string;
  name: string;
  chain: string;
  category: 'lending' | 'dex' | 'staking' | 'yield-farming' | 'derivatives';
  tvl: number;
  riskScore: number;
  contractAddresses: string[];
}

export interface User {
  id: string;
  walletAddress: string;
  chain: string;
  createdAt: Date;
  isActive: boolean;
}

export interface RebalanceStrategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  parameters: Record<string, any>;
}

export interface Alert {
  id: string;
  userId: string;
  type: 'yield' | 'risk' | 'price' | 'rebalance';
  conditions: Record<string, any>;
  methods: ('email' | 'webhook' | 'push')[];
  isActive: boolean;
  createdAt: Date;
}

export interface Transaction {
  hash: string;
  chain: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: number;
  gasPrice?: number;
  timestamp: Date;
  blockNumber?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    requestId?: string;
    [key: string]: any;
  };
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  metadata: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    timestamp: string;
  };
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Context type for Hono middleware
export interface AppContext {
  yieldMonitoringService: any;
  rebalancingService: any;
  positionTrackingService: any;
}

// Environment variables type
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  LOG_LEVEL: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  
  // NEAR config
  NEAR_RPC_URL: string;
  NEAR_ACCOUNT_ID: string;
  NEAR_PRIVATE_KEY?: string;
  
  // Ethereum config
  ETHEREUM_RPC_URL: string;
  ETHEREUM_PRIVATE_KEY?: string;
  
  // TEE config
  TEE_ENDPOINT: string;
  TEE_API_KEY?: string;
  
  // Database
  DATABASE_URL: string;
  REDIS_URL: string;
  
  // Feature flags
  ENABLE_AUTO_REBALANCING: boolean;
  ENABLE_CROSS_CHAIN: boolean;
  ENABLE_YIELD_ALERTS: boolean;
  MOCK_BLOCKCHAIN_CALLS: boolean;
}