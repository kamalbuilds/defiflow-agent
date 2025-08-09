import { Context } from 'hono';
import { YieldMonitoringService } from '../services/YieldMonitoringService';
import { RebalancingService } from '../services/RebalancingService';
import { PositionTrackingService } from '../services/PositionTrackingService';

export interface AppBindings {
  Variables: {
    yieldMonitoringService: YieldMonitoringService;
    rebalancingService: RebalancingService;
    positionTrackingService: PositionTrackingService;
  };
}

export type AppContext = Context<AppBindings>;