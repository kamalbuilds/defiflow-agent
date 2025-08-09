-- Initialize DeFiFlow database schema

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for wallet tracking
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    chain VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Positions table for tracking DeFi positions
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position_external_id VARCHAR(255) NOT NULL,
    protocol VARCHAR(100) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    position_type VARCHAR(50) NOT NULL, -- lending, liquidity, staking, farming
    token_address VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    value_usd DECIMAL(36, 2) NOT NULL,
    apy DECIMAL(8, 4) NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 1 AND risk_score <= 10),
    entry_price DECIMAL(36, 18) NOT NULL,
    current_price DECIMAL(36, 18) NOT NULL,
    pnl DECIMAL(36, 2) NOT NULL DEFAULT 0,
    pnl_percentage DECIMAL(8, 4) NOT NULL DEFAULT 0,
    lock_period INTEGER, -- in days
    unlock_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Position history for tracking changes over time
CREATE TABLE IF NOT EXISTS position_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
    value_usd DECIMAL(36, 2) NOT NULL,
    apy DECIMAL(8, 4) NOT NULL,
    current_price DECIMAL(36, 18) NOT NULL,
    pnl DECIMAL(36, 2) NOT NULL,
    rewards_value DECIMAL(36, 2) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Yield opportunities table
CREATE TABLE IF NOT EXISTS yield_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) NOT NULL UNIQUE,
    protocol VARCHAR(100) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    pool_id VARCHAR(255) NOT NULL,
    token VARCHAR(20) NOT NULL,
    apy DECIMAL(8, 4) NOT NULL,
    tvl DECIMAL(36, 2) NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 1 AND risk_score <= 10),
    min_deposit DECIMAL(36, 18) NOT NULL,
    max_deposit DECIMAL(36, 18),
    lock_period INTEGER, -- in days
    fees JSONB NOT NULL, -- {deposit, withdraw, management}
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Yield alerts table
CREATE TABLE IF NOT EXISTS yield_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    min_apy DECIMAL(8, 4) NOT NULL,
    max_risk INTEGER NOT NULL CHECK (max_risk >= 1 AND max_risk <= 10),
    protocols TEXT[], -- array of protocol names
    alert_methods TEXT[] NOT NULL, -- email, webhook, push
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rebalance executions table
CREATE TABLE IF NOT EXISTS rebalance_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, executing, completed, failed, partial
    actions JSONB NOT NULL,
    transactions JSONB DEFAULT '[]',
    results JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Auto-rebalance settings table
CREATE TABLE IF NOT EXISTS auto_rebalance_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    strategy VARCHAR(50) NOT NULL,
    triggers JSONB NOT NULL,
    max_slippage DECIMAL(5, 4) NOT NULL,
    gas_limit INTEGER NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_executed TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_chain ON users(chain);

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_protocol ON positions(protocol);
CREATE INDEX IF NOT EXISTS idx_positions_chain ON positions(chain);
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON positions(is_active);

CREATE INDEX IF NOT EXISTS idx_position_history_position_id ON position_history(position_id);
CREATE INDEX IF NOT EXISTS idx_position_history_timestamp ON position_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_yield_opportunities_protocol ON yield_opportunities(protocol);
CREATE INDEX IF NOT EXISTS idx_yield_opportunities_chain ON yield_opportunities(chain);
CREATE INDEX IF NOT EXISTS idx_yield_opportunities_apy ON yield_opportunities(apy);
CREATE INDEX IF NOT EXISTS idx_yield_opportunities_is_active ON yield_opportunities(is_active);

CREATE INDEX IF NOT EXISTS idx_yield_alerts_user_id ON yield_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_yield_alerts_is_active ON yield_alerts(is_active);

CREATE INDEX IF NOT EXISTS idx_rebalance_executions_user_id ON rebalance_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_rebalance_executions_status ON rebalance_executions(status);
CREATE INDEX IF NOT EXISTS idx_rebalance_executions_started_at ON rebalance_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_auto_rebalance_settings_user_id ON auto_rebalance_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_rebalance_settings_is_enabled ON auto_rebalance_settings(is_enabled);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yield_opportunities_updated_at BEFORE UPDATE ON yield_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yield_alerts_updated_at BEFORE UPDATE ON yield_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_rebalance_settings_updated_at BEFORE UPDATE ON auto_rebalance_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for development
INSERT INTO users (wallet_address, chain) VALUES 
    ('0x1234567890123456789012345678901234567890', 'ethereum'),
    ('alice.near', 'near')
ON CONFLICT (wallet_address) DO NOTHING;

-- Insert sample yield opportunities
INSERT INTO yield_opportunities (external_id, protocol, chain, pool_id, token, apy, tvl, risk_score, min_deposit, fees, metadata) VALUES 
    ('aave_usdc_eth', 'aave-v3', 'ethereum', 'usdc', 'USDC', 4.25, 800000000, 2, 1, '{"deposit": 0, "withdraw": 0, "management": 0}', '{"poolType": "lending", "autoCompound": false}'),
    ('ref_near_usdc', 'ref-finance', 'near', 'pool_1', 'USDC', 12.50, 5000000, 4, 10, '{"deposit": 0, "withdraw": 0.003, "management": 0.002}', '{"poolType": "liquidity", "underlying": ["USDC", "NEAR"], "autoCompound": true}')
ON CONFLICT (external_id) DO NOTHING;