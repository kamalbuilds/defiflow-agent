'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, TrendingUp, Shield, Zap, DollarSign, Activity, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { NearWalletConnect } from '@/components/wallet/near-connect';
import { useDefiFlow } from '@/lib/hooks/use-defiflow';

export default function DeFiFlowDashboard() {
  const { 
    yields, 
    positions, 
    recommendations, 
    agentStatus, 
    loading, 
    error,
    executeRecommendation 
  } = useDefiFlow();
  
  const [stats, setStats] = useState({
    totalValue: 0,
    averageApy: 0,
    riskScore: 0,
    pendingActions: 0
  });

  useEffect(() => {
    calculateStats();
  }, [positions, recommendations]);

  const calculateStats = () => {
    const totalValue = positions.reduce((sum, p) => sum + (p.value || 0), 0);
    const averageApy = positions.length > 0 
      ? positions.reduce((sum, p) => sum + (p.apy || 0), 0) / positions.length 
      : 0;
    const riskScore = positions.length > 0
      ? positions.reduce((sum, p) => sum + (p.riskScore || 5), 0) / positions.length
      : 0;
    
    setStats({
      totalValue,
      averageApy,
      riskScore,
      pendingActions: recommendations.length
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatAPY = (apy: number) => {
    return `${apy.toFixed(2)}%`;
  };

  const getRiskBadgeColor = (risk: string | number) => {
    const riskValue = typeof risk === 'string' ? 
      (risk === 'low' ? 2 : risk === 'medium' ? 5 : 8) : risk;
    
    if (riskValue <= 3) return 'bg-green-500';
    if (riskValue <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getChainBadgeColor = (chain: string) => {
    const colors: Record<string, string> = {
      'near': 'bg-green-500',
      'ethereum': 'bg-blue-500',
      'bsc': 'bg-yellow-500',
      'polygon': 'bg-purple-500'
    };
    return colors[chain] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DeFiFlow Agent
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              AI-powered yield optimization across multiple chains
            </p>
          </div>
          <div className="flex items-center gap-4">
            {agentStatus && (
              <Badge variant={agentStatus.isConnected ? 'default' : 'secondary'}>
                <Activity className="w-3 h-3 mr-1" />
                Agent {agentStatus.isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            )}
            <NearWalletConnect />
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Value Locked
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {positions.length} positions
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average APY
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatAPY(stats.averageApy)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Portfolio average
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Risk Score
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.riskScore.toFixed(1)}/10
                </div>
                <p className="text-xs text-muted-foreground">
                  Portfolio weighted
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Optimization Actions
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingActions}</div>
                <p className="text-xs text-muted-foreground">
                  Pending recommendations
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="opportunities" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="opportunities">Yield Opportunities</TabsTrigger>
            <TabsTrigger value="positions">My Positions</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Yield Opportunities</CardTitle>
                <CardDescription>
                  Discover the best yield farming opportunities across all supported chains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : yields.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No yield opportunities available</p>
                  ) : (
                    yields.slice(0, 10).map((opportunity, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-12 rounded-full" 
                            style={{ backgroundColor: `hsl(${120 - (opportunity.riskScore || 5) * 12}, 70%, 50%)` }}
                          />
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              {opportunity.pool || opportunity.protocol}
                              <Badge variant="outline" className={`text-xs text-white ${getChainBadgeColor(opportunity.chain)}`}>
                                {opportunity.chain}
                              </Badge>
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {opportunity.protocol} • TVL: {formatNumber(opportunity.tvl)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              {formatAPY(opportunity.apy)}
                            </p>
                            <p className="text-xs text-gray-500">APY</p>
                          </div>
                          <Badge className={getRiskBadgeColor(opportunity.risk || opportunity.riskScore || 5)}>
                            Risk: {opportunity.riskScore || 5}/10
                          </Badge>
                          <Button size="sm" variant="outline">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your DeFi Positions</CardTitle>
                <CardDescription>
                  Monitor and manage your active yield farming positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : positions.length === 0 ? (
                    <div className="text-center py-8">
                      <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No active positions yet</p>
                      <p className="text-sm text-gray-400 mt-2">Start by exploring yield opportunities!</p>
                    </div>
                  ) : (
                    positions.map((position, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              {position.tokenSymbol}
                              <Badge variant="outline" className={`text-xs text-white ${getChainBadgeColor(position.chain)}`}>
                                {position.chain}
                              </Badge>
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {position.protocol} • Amount: {position.amount}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{formatNumber(position.value)}</p>
                            <p className="text-xs text-green-600">{formatAPY(position.apy)} APY</p>
                          </div>
                          <Badge className={getRiskBadgeColor(position.riskScore || 5)}>
                            Risk: {position.riskScore || 5}/10
                          </Badge>
                          <Button size="sm" variant="outline">
                            Manage
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>
                  Personalized suggestions to optimize your yield farming strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No recommendations at this time</p>
                      <p className="text-sm text-gray-400 mt-2">The AI agent is analyzing opportunities...</p>
                    </div>
                  ) : (
                    recommendations.map((rec, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border rounded-lg space-y-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold capitalize flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            {rec.strategy?.replace(/_/g, ' ') || 'Optimization'}
                          </h4>
                          <Badge variant={rec.urgency === 'high' ? 'destructive' : rec.urgency === 'medium' ? 'default' : 'secondary'}>
                            {rec.urgency || 'medium'} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {rec.actions && rec.actions[0] && (
                            `Move funds from ${rec.actions[0].fromProtocol} to ${rec.actions[0].toProtocol}`
                          )}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="space-y-1">
                            <p>Expected APY gain: <span className="font-semibold text-green-600">+{formatAPY(rec.expectedGains?.apyIncrease || 0)}</span></p>
                            <p>Confidence: <span className="font-semibold">{rec.confidence || 0}%</span></p>
                          </div>
                          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            Execute
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}