'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StrategyConfig {
  riskTolerance: number;
  minAPY: number;
  maxPositions: number;
  rebalanceThreshold: number;
  preferredChains: string[];
  autoCompound: boolean;
  gasOptimization: boolean;
  impermanentLossLimit: number;
}

export function StrategyConfiguration() {
  const [config, setConfig] = useState<StrategyConfig>({
    riskTolerance: 5,
    minAPY: 10,
    maxPositions: 10,
    rebalanceThreshold: 15,
    preferredChains: ['near', 'ethereum'],
    autoCompound: true,
    gasOptimization: true,
    impermanentLossLimit: 5
  });

  const chains = [
    { value: 'near', label: 'NEAR Protocol' },
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'bsc', label: 'BNB Chain' },
    { value: 'polygon', label: 'Polygon' }
  ];

  const handleSave = async () => {
    try {
      const response = await fetch('/api/strategy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        // Show success message
        console.log('Strategy configuration saved');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Configuration</CardTitle>
        <CardDescription>
          Customize your yield farming strategy parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Tolerance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="risk-tolerance">Risk Tolerance</Label>
            <span className="text-sm text-muted-foreground">
              {config.riskTolerance}/10
            </span>
          </div>
          <Slider
            id="risk-tolerance"
            value={[config.riskTolerance]}
            onValueChange={([value]) => setConfig({ ...config, riskTolerance: value })}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative</span>
            <span>Moderate</span>
            <span>Aggressive</span>
          </div>
        </div>

        {/* Minimum APY */}
        <div className="space-y-2">
          <Label htmlFor="min-apy">Minimum APY Target (%)</Label>
          <Input
            id="min-apy"
            type="number"
            value={config.minAPY}
            onChange={(e) => setConfig({ ...config, minAPY: Number(e.target.value) })}
            min={0}
            max={100}
          />
        </div>

        {/* Maximum Positions */}
        <div className="space-y-2">
          <Label htmlFor="max-positions">Maximum Active Positions</Label>
          <Input
            id="max-positions"
            type="number"
            value={config.maxPositions}
            onChange={(e) => setConfig({ ...config, maxPositions: Number(e.target.value) })}
            min={1}
            max={50}
          />
        </div>

        {/* Rebalance Threshold */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="rebalance-threshold">Rebalance Threshold (%)</Label>
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>
          <Input
            id="rebalance-threshold"
            type="number"
            value={config.rebalanceThreshold}
            onChange={(e) => setConfig({ ...config, rebalanceThreshold: Number(e.target.value) })}
            min={5}
            max={50}
          />
          <p className="text-xs text-muted-foreground">
            Trigger rebalancing when APY difference exceeds this threshold
          </p>
        </div>

        {/* Preferred Chains */}
        <div className="space-y-2">
          <Label>Preferred Chains</Label>
          <div className="flex flex-wrap gap-2">
            {chains.map((chain) => (
              <Badge
                key={chain.value}
                variant={config.preferredChains.includes(chain.value) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  const isSelected = config.preferredChains.includes(chain.value);
                  setConfig({
                    ...config,
                    preferredChains: isSelected
                      ? config.preferredChains.filter(c => c !== chain.value)
                      : [...config.preferredChains, chain.value]
                  });
                }}
              >
                {chain.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Auto Compound */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-compound">Auto-Compound Rewards</Label>
            <p className="text-xs text-muted-foreground">
              Automatically reinvest earned rewards
            </p>
          </div>
          <Switch
            id="auto-compound"
            checked={config.autoCompound}
            onCheckedChange={(checked) => setConfig({ ...config, autoCompound: checked })}
          />
        </div>

        {/* Gas Optimization */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="gas-optimization">Gas Cost Optimization</Label>
            <p className="text-xs text-muted-foreground">
              Batch transactions to minimize gas fees
            </p>
          </div>
          <Switch
            id="gas-optimization"
            checked={config.gasOptimization}
            onCheckedChange={(checked) => setConfig({ ...config, gasOptimization: checked })}
          />
        </div>

        {/* Impermanent Loss Limit */}
        <div className="space-y-2">
          <Label htmlFor="il-limit">Impermanent Loss Limit (%)</Label>
          <Input
            id="il-limit"
            type="number"
            value={config.impermanentLossLimit}
            onChange={(e) => setConfig({ ...config, impermanentLossLimit: Number(e.target.value) })}
            min={0}
            max={20}
          />
        </div>

        {/* Warning Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Strategy changes will affect future rebalancing decisions. 
            Current positions will not be immediately modified.
          </AlertDescription>
        </Alert>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full">
          Save Strategy Configuration
        </Button>
      </CardContent>
    </Card>
  );
}