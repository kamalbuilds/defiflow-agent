export interface YieldOpportunity {
  id: string;
  protocol: string;
  chain: string;
  pool: string;
  apy: number;
  apr?: number;
  tvl: number;
  volume24h?: number;
  risk: RiskLevel;
  impermanentLoss: number;
  tokens: string[];
  rewards?: RewardInfo[];
  metadata?: Record<string, any>;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RewardInfo {
  token: string;
  amount: number;
  value: number;
  apr: number;
}

export interface YieldStrategy {
  id: string;
  name: string;
  description: string;
  riskTolerance: RiskLevel;
  minAPY: number;
  maxImpermanentLoss: number;
  rebalanceThreshold: number;
  gasOptimization: boolean;
  preferredChains: string[];
  preferredProtocols: string[];
}

export interface YieldPosition {
  id: string;
  protocol: string;
  chain: string;
  pool: string;
  value: number;
  entryPrice: number;
  currentPrice: number;
  apy: number;
  earned: number;
  impermanentLoss: number;
  timestamp: string;
}

export interface RebalanceAction {
  type: 'withdraw' | 'deposit' | 'swap' | 'compound';
  fromProtocol?: string;
  toProtocol?: string;
  fromChain?: string;
  toChain?: string;
  token: string;
  amount: string;
  estimatedGas: string;
  estimatedReturn: string;
}