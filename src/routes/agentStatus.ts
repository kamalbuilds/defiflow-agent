import { Hono } from 'hono';
import { agentAccountId, agent, agentInfo, getAgentBalance, getAgentState } from '../lib/shade-agent';

import type { AppBindings } from '../types/hono';

const agentStatusRoutes = new Hono<AppBindings>();

agentStatusRoutes.get('/status', async (c) => {
  try {
    const accountId = await agentAccountId();

    console.log('accountId', accountId);

    const balance = await getAgentBalance();
    console.log('balance', balance);
    const info = await agentInfo();
    console.log('info', info);
    
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

agentStatusRoutes.get('/accounts', async (c) => {
  try {
    const nearAccount = await agentAccountId();
    const contractId = process.env.CONTRACT_ID || `ac-proxy.${process.env.NEAR_ACCOUNT_ID}`;
    
    // TODO: Implement proper EVM address derivation using chainsig.js
    // For now, using placeholder addresses based on contract ID hash
    const hashBase = Buffer.from(contractId).toString('hex').substring(0, 40);
    const ethAddress = `0x${hashBase.padEnd(40, '0')}`;
    const bscAddress = `0x${hashBase.padEnd(40, '1')}`;
    const polygonAddress = `0x${hashBase.padEnd(40, '2')}`;
    
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

export { agentStatusRoutes };