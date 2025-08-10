'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, LogOut, Copy, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WalletInfo {
  accountId: string;
  balance: string;
  isConnected: boolean;
}

export function NearWalletConnect() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    // In production, this would check NEAR wallet connection
    const storedWallet = localStorage.getItem('near-wallet');
    if (storedWallet) {
      setWallet(JSON.parse(storedWallet));
    }
  };

  const connectWallet = async () => {
    setConnecting(true);
    try {
      // In production, this would initiate NEAR wallet connection
      // For demo purposes, we'll simulate a connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockWallet: WalletInfo = {
        accountId: 'user.testnet',
        balance: '125.4',
        isConnected: true
      };
      
      setWallet(mockWallet);
      localStorage.setItem('near-wallet', JSON.stringify(mockWallet));
      setShowDialog(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    localStorage.removeItem('near-wallet');
  };

  const copyAddress = () => {
    if (wallet?.accountId) {
      navigator.clipboard.writeText(wallet.accountId);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (wallet?.isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="px-3 py-1">
          <span className="text-xs">{wallet.balance} NEAR</span>
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setShowDialog(true)}
        >
          <Wallet className="w-4 h-4" />
          {truncateAddress(wallet.accountId)}
        </Button>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>NEAR Wallet</DialogTitle>
              <DialogDescription>
                Manage your NEAR Protocol wallet connection
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Account</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="font-mono text-sm">{wallet.accountId}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Balance</p>
                <p className="text-2xl font-bold">{wallet.balance} NEAR</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`https://explorer.testnet.near.org/accounts/${wallet.accountId}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Explorer
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    disconnectWallet();
                    setShowDialog(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect NEAR Wallet</DialogTitle>
            <DialogDescription>
              Connect your NEAR wallet to start yield farming
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button
              onClick={connectWallet}
              disabled={connecting}
              className="w-full"
              size="lg"
            >
              {connecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  NEAR Wallet
                </>
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Don't have a NEAR wallet?
              </p>
              <Button
                variant="link"
                onClick={() => window.open('https://wallet.near.org', '_blank')}
              >
                Create Wallet
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}