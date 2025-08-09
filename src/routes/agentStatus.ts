import { Hono } from 'hono';
import { agentAccountId, agent, agentInfo } from '@neardefi/shade-agent-js';

const app = new Hono();

app.get('/status', async (c) => {
  try {
    const accountId = await agentAccountId();
    const balance = await agent('getBalance');
    const info = await agentInfo();
    
    return c.json({
      status: 'active',
      accountId,
      balance,
      contractInfo: info,
      teeEnabled: process.env.NODE_ENV === 'production',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    return c.json({ error: 'Failed to fetch agent status' }, 500);
  }
});

app.get('/accounts', async (c) => {
  try {
    const nearAccount = await agentAccountId();
    
    // Get derived addresses for different chains
    const { Evm } = await import('chainsig.js');
    const contractId = process.env.CONTRACT_ID || `ac-proxy.${process.env.NEAR_ACCOUNT_ID}`;
    
    const { address: ethAddress } = await Evm.deriveAddressAndPublicKey(
      contractId,
      'ethereum-defiflow'
    );
    
    const { address: bscAddress } = await Evm.deriveAddressAndPublicKey(
      contractId,
      'bsc-defiflow'
    );
    
    const { address: polygonAddress } = await Evm.deriveAddressAndPublicKey(
      contractId,
      'polygon-defiflow'
    );
    
    return c.json({
      near: {
        accountId: nearAccount,
        network: 'testnet'
      },
      ethereum: {
        address: ethAddress,
        network: 'sepolia'
      },
      bsc: {
        address: bscAddress,
        network: 'testnet'
      },
      polygon: {
        address: polygonAddress,
        network: 'mumbai'
      }
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return c.json({ error: 'Failed to fetch accounts' }, 500);
  }
});

export { app as agentStatus };