// pages/shyft-demo/index.tsx
import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ShyftSdk, Network } from '@shyft-to/js';
import useShyft from '@/hooks/transactions/useShyft';

interface TokenInfo {
  name: string;
  symbol: string;
  image: string;
}

interface TokenBalance {
  address: string;
  balance: number;
  info: TokenInfo;
}

export default function ShyftDemo() {
  const { primaryWallet } = useDynamicContext();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);

  const { getWalletBalance, connection } = useShyft();

  useEffect(() => {
    if (connection && primaryWallet?.address) {
      fetchSolBalance();
      fetchTokenBalances();
    }
  }, [connection, primaryWallet?.address]);

  const fetchSolBalance = async () => {
    if (!primaryWallet?.address) return;
    if (!connection) return;
    try {
      console.log('Fetching SOL balance for:', primaryWallet.address);
      const balance = await getWalletBalance(primaryWallet.address);
      console.log('Raw balance returned:', balance);
      setSolBalance(balance);
    } catch (err) {
      console.error('Error fetching SOL balance:', err);
    }
  };

  const fetchTokenBalances = async () => {
    if (!primaryWallet?.address) return;
    if (!connection) return;
    try {
      setLoading(true);
      const shyft = new ShyftSdk({ apiKey: process.env.NEXT_PUBLIC_SHYFT_API_KEY || '', network: Network.Mainnet });
      const balances = await shyft.wallet.getAllTokenBalance({ wallet: primaryWallet.address });
      if (balances && Array.isArray(balances)) {
        setTokenBalances(balances);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">SHYFT Token Dashboard</h1>
      
      {!primaryWallet?.address ? (
        <div className="text-center py-12">
          <p className="text-xl">Please connect your wallet to continue</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <p className="text-xl">Loading...</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-500">Native SOL Balance</p>
            <p className="text-xl font-semibold">
              {solBalance === null ? 'Fetching...' : solBalance}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tokenBalances.map((token) => (
              <div key={token.address} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  {token.info.image && (
                    <img
                      src={token.info.image}
                      alt={token.info.name}
                      className="w-8 h-8 mr-3"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-medium">{token.info.name}</h3>
                    <p className="text-gray-500">{token.info.symbol}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="text-xl font-semibold">{token.balance}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}