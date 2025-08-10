import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3140';

export interface YieldOpportunity {
  id: string;
  protocol: string;
  chain: string;
  pool: string;
  apy: number;
  tvl: number;
  risk: string;
  riskScore: number;
  token0Symbol?: string;
  token1Symbol?: string;
  volume24h?: number;
  fee?: number;
}

export interface Position {
  id: string;
  protocol: string;
  chain: string;
  tokenSymbol: string;
  amount: number;
  value: number;
  apy: number;
  riskScore: number;
  rewards?: any[];
}

export interface Recommendation {
  id: string;
  strategy: string;
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
  expectedGains: {
    apyIncrease: number;
    valueIncrease?: number;
    riskReduction?: number;
  };
  actions: Array<{
    type: string;
    fromProtocol: string;
    toProtocol: string;
    fromChain: string;
    toChain: string;
    token: string;
    amount: number;
  }>;
}

export interface AgentStatus {
  isConnected: boolean;
  contractId?: string;
  nearAccount?: string;
  lastSync?: Date;
}

export function useDefiFlow() {
  const [yields, setYields] = useState<YieldOpportunity[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/status`);
      setAgentStatus(response.data);
    } catch (err) {
      console.error('Error fetching agent status:', err);
    }
  }, []);

  const fetchYields = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/yield-monitor/opportunities`);
      setYields(response.data.opportunities || []);
    } catch (err) {
      console.error('Error fetching yields:', err);
      setError('Failed to fetch yield opportunities');
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/positions`);
      setPositions(response.data.positions || []);
    } catch (err) {
      console.error('Error fetching positions:', err);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rebalance/recommendations`);
      setRecommendations(response.data.recommendations || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    await Promise.all([
      fetchAgentStatus(),
      fetchYields(),
      fetchPositions(),
      fetchRecommendations()
    ]);
    
    setLoading(false);
  }, [fetchAgentStatus, fetchYields, fetchPositions, fetchRecommendations]);

  const executeRecommendation = useCallback(async (recommendationId: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/rebalance/execute`, {
        recommendationId
      });
      
      // Refresh data after execution
      await fetchAll();
      
      return response.data;
    } catch (err) {
      console.error('Error executing recommendation:', err);
      throw err;
    }
  }, [fetchAll]);

  const createAlert = useCallback(async (alertConfig: {
    type: 'apy_threshold' | 'risk_change' | 'new_opportunity';
    threshold?: number;
    chain?: string;
    protocol?: string;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/yield-monitor/alerts`, alertConfig);
      return response.data;
    } catch (err) {
      console.error('Error creating alert:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchAll();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchAll, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchAll]);

  return {
    yields,
    positions,
    recommendations,
    agentStatus,
    loading,
    error,
    refetch: fetchAll,
    executeRecommendation,
    createAlert
  };
}

// Hook for individual position management
export function usePosition(positionId: string) {
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPosition = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/positions/${positionId}`);
      setPosition(response.data);
    } catch (err) {
      console.error('Error fetching position:', err);
    } finally {
      setLoading(false);
    }
  }, [positionId]);

  const withdraw = useCallback(async (amount: number) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/positions/${positionId}/withdraw`, {
        amount
      });
      await fetchPosition();
      return response.data;
    } catch (err) {
      console.error('Error withdrawing:', err);
      throw err;
    }
  }, [positionId, fetchPosition]);

  const deposit = useCallback(async (amount: number) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/positions/${positionId}/deposit`, {
        amount
      });
      await fetchPosition();
      return response.data;
    } catch (err) {
      console.error('Error depositing:', err);
      throw err;
    }
  }, [positionId, fetchPosition]);

  useEffect(() => {
    fetchPosition();
  }, [fetchPosition]);

  return {
    position,
    loading,
    refetch: fetchPosition,
    withdraw,
    deposit
  };
}