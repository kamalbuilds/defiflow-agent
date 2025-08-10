import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';

export interface DeFiPosition {
  protocol_name: string;
  protocol_id: string;
  protocol_url: string;
  protocol_logo: string;
  total_usd_value: number;
  total_unclaimed_usd_value: number;
  positions: Array<{
    label: string;
    tokens: Array<{
      token_type: string;
      name: string;
      symbol: string;
      contract_address: string;
      decimals: number;
      logo?: string;
      balance: string;
      balance_formatted: string;
      usd_price: number;
      usd_value: number;
    }>;
    address: string;
    balance_usd: number;
    position_details?: {
      apy?: number;
      is_debt?: boolean;
      shares?: string;
      reserve0?: string;
      reserve1?: string;
    };
  }>;
}

export class MoralisService {
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY || "YOUR_API_KEY_HERE"
      });
      this.initialized = true;
      console.log('Moralis service initialized');
    } catch (error) {
      console.error('Failed to initialize Moralis:', error);
      throw error;
    }
  }

  /**
   * Get DeFi summary for a wallet across all protocols
   */
  async getDefiSummary(walletAddress: string, chain: EvmChain = EvmChain.ETHEREUM) {
    await this.ensureInitialized();

    try {
      const response = await Moralis.EvmApi.wallets.getDefiSummary({
        chain: chain.hex,
        address: walletAddress
      });

      return response.raw;
    } catch (error) {
      console.error('Error fetching DeFi summary:', error);
      throw error;
    }
  }

  /**
   * Get all DeFi positions for a wallet
   */
  async getDefiPositions(walletAddress: string, chain: EvmChain = EvmChain.ETHEREUM): Promise<DeFiPosition[]> {
    await this.ensureInitialized();

    try {
      const response = await Moralis.EvmApi.wallets.getDefiPositionsSummary({
        chain: chain.hex,
        address: walletAddress
      });

      // Transform response to our DeFiPosition interface
      const positions = response.raw as unknown as DeFiPosition[];
      return positions;
    } catch (error) {
      console.error('Error fetching DeFi positions:', error);
      return [];
    }
  }

  /**
   * Get detailed positions for a specific protocol
   */
  async getProtocolPositions(
    walletAddress: string, 
    protocol: string, 
    chain: EvmChain = EvmChain.ETHEREUM
  ): Promise<DeFiPosition | null> {
    await this.ensureInitialized();

    try {
      const response = await Moralis.EvmApi.wallets.getDefiPositionsByProtocol({
        chain: chain.hex,
        address: walletAddress,
        protocol: protocol as any
      });

      return response.raw as unknown as DeFiPosition;
    } catch (error) {
      console.error(`Error fetching ${protocol} positions:`, error);
      return null;
    }
  }

  /**
   * Get token balances for a wallet
   */
  async getTokenBalances(walletAddress: string, chain: EvmChain = EvmChain.ETHEREUM) {
    await this.ensureInitialized();

    try {
      const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        chain: chain.hex,
        address: walletAddress
      });

      return response.raw;
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  }

  /**
   * Get NFT positions (useful for some DeFi protocols that use NFTs)
   */
  async getNFTPositions(walletAddress: string, chain: EvmChain = EvmChain.ETHEREUM) {
    await this.ensureInitialized();

    try {
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        chain: chain.hex,
        address: walletAddress
      });

      return response.raw;
    } catch (error) {
      console.error('Error fetching NFT positions:', error);
      return [];
    }
  }

  /**
   * Get wallet transaction history
   */
  async getTransactionHistory(walletAddress: string, chain: EvmChain = EvmChain.ETHEREUM) {
    await this.ensureInitialized();

    try {
      const response = await Moralis.EvmApi.transaction.getWalletTransactions({
        chain: chain.hex,
        address: walletAddress
      });

      return response.raw;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get current ETH price
   */
  async getTokenPrice(tokenAddress: string, chain: EvmChain = EvmChain.ETHEREUM) {
    await this.ensureInitialized();

    try {
      const response = await Moralis.EvmApi.token.getTokenPrice({
        chain: chain.hex,
        address: tokenAddress
      });

      return response.raw;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const moralisService = new MoralisService();