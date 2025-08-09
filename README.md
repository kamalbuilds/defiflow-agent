# DeFiFlow: Autonomous Cross-Chain Yield Optimization Agent

## 🏆 Fork that Near Hackathon Submission

DeFiFlow is a decentralized, verifiable AI agent that autonomously optimizes yield across multiple blockchains using NEAR's Shade Agent Framework.

## 🎯 Problem Statement

Current DeFi yield farming requires:
- Constant manual monitoring across multiple chains
- Complex strategy adjustments
- High gas costs for frequent rebalancing
- Deep technical knowledge

DeFiFlow solves these issues with autonomous, privacy-preserving yield optimization.

## 🚀 Features

- **Multi-Chain Support**: NEAR, Ethereum, BSC, Polygon
- **TEE-Protected Strategies**: Private yield optimization algorithms
- **AI-Powered Decisions**: LLM-based risk assessment and strategy optimization
- **Verifiable Execution**: All operations run in Trusted Execution Environment
- **Natural Language Interface**: Configure strategies with simple commands

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         TEE Environment (Private)        │
├─────────────────────────────────────────┤
│  • Yield Strategy AI                     │
│  • Cross-chain Position Monitor          │
│  • Private User Preference Engine        │
│  • Automated Rebalancing Logic          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      NEAR Agent Contract (Public)       │
├─────────────────────────────────────────┤
│  • Request Signature                    │
│  • Register Agent                       │
│  • Approve Code Hash                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Multi-Chain Execution (Verifiable)   │
├─────────────────────────────────────────┤
│  • Ethereum: Uniswap, Aave, Compound    │
│  • NEAR: Ref Finance, Burrow            │
│  • BSC: PancakeSwap, Venus              │
│  • Polygon: QuickSwap, Aave             │
└─────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Shade Agent Framework**: TEE-based execution
- **NEAR Protocol**: Decentralized key management
- **TypeScript/Node.js**: Core agent logic
- **Hono Framework**: Lightweight API server
- **chainsig.js**: Multi-chain transaction building
- **ethers.js**: Ethereum integration
- **AI/LLM**: Strategy optimization

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/kamalbuilds/defiflow-agent

cd defiflow-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your NEAR account details

# Run locally
npm run dev

# Deploy to TEE
shade-agent-cli --phala
```

## 🔑 Environment Variables

```bash
NEAR_ACCOUNT_ID=your-account.testnet
NEAR_SEED_PHRASE="your seed phrase"
PHALA_API_KEY=your-phala-api-key
ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key
BSC_RPC_URL=https://bsc-testnet.publicnode.com
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your-key
```

## 📊 Supported Protocols

### NEAR
- Ref Finance (DEX)
- Burrow (Lending)
- Pembrock Finance (Yield)

### Ethereum
- Uniswap V3 (DEX)
- Aave V3 (Lending)
- Compound V3 (Lending)

### BSC
- PancakeSwap V3 (DEX)
- Venus Protocol (Lending)

### Polygon
- QuickSwap V3 (DEX)
- Aave V3 (Lending)

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test TEE deployment locally
npm run test:tee
```

## 🏆 Hackathon Tracks

This project qualifies for:
1. **Proximity Track**: Build the Agentic Future with Shade Agents ($2,000)
2. **Main Track - Autonomous Agents on Near**: Practical AI agents using Shade Framework
3. **Main Track - Chain Abstraction**: Cross-chain wallet and action management

## 📈 Demo Scenarios

1. **Basic Yield Optimization**
   - Deploy capital to highest APY pool
   - Auto-compound rewards
   - Rebalance on threshold breach

2. **Advanced Strategy**
   - Monitor impermanent loss
   - Dynamic risk adjustment
   - Cross-chain arbitrage

3. **Natural Language Control**
   - "Maximize yield with less than 5% IL risk"
   - "Move funds to stablecoin farms during volatility"

## 🔒 Security

- All private keys managed by NEAR MPC
- TEE attestation for verifiable execution
- No direct access to user funds
- Auditable transaction history

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Team

Built for NEAR x NYC Hackathon 2025

## 📞 Support

- Telegram: https://t.me/shadeagents
- Discord: [Join our server]
- Email: support@defiflow.ai

---

🏗️ Built with Shade Agents on NEAR Protocol