import { useState } from 'react';
import useShyft from '@/hooks/transactions/useShyft';
import { PublicKey } from '@solana/web3.js';

export default function ShyftTest() {
  const [address, setAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [results, setResults] = useState<any>(null);
  const { 
    shyft,
    connection,
    getWalletBalance,
    getTokenBalance,
    getAllTokenBalance,
    getAccountInfo 
  } = useShyft();

  const handleGetBalance = async () => {
    try {
      const balance = await getWalletBalance(address);
      setResults({ type: 'SOL Balance', data: balance });
    } catch (error: any) {
      setResults({ type: 'Error', data: error.message });
    }
  };

  const handleGetTokenBalance = async () => {
    try {
      const balance = await getTokenBalance(address, tokenAddress);
      setResults({ type: 'Token Balance', data: balance });
    } catch (error: any) {
      setResults({ type: 'Error', data: error.message });
    }
  };

  const handleGetAllTokens = async () => {
    try {
      const balances = await getAllTokenBalance(address);
      setResults({ type: 'All Token Balances', data: balances });
    } catch (error: any) {
      setResults({ type: 'Error', data: error.message });
    }
  };

  const handleGetAccountInfo = async () => {
    try {
      const info = await getAccountInfo(address);
      setResults({ type: 'Account Info', data: info });
    } catch (error: any) {
      setResults({ type: 'Error', data: error.message });
    }
  };

  const isValidAddress = (addr: string) => {
    try {
      new PublicKey(addr);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8">Shyft SDK Test</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Wallet Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Enter wallet address"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Token Address (Optional)</label>
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Enter token address"
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleGetBalance}
                    disabled={!isValidAddress(address)}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                  >
                    Get SOL Balance
                  </button>
                  
                  <button
                    onClick={handleGetTokenBalance}
                    disabled={!isValidAddress(address) || !isValidAddress(tokenAddress)}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                  >
                    Get Token Balance
                  </button>
                  
                  <button
                    onClick={handleGetAllTokens}
                    disabled={!isValidAddress(address)}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                  >
                    Get All Tokens
                  </button>
                  
                  <button
                    onClick={handleGetAccountInfo}
                    disabled={!isValidAddress(address)}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                  >
                    Get Account Info
                  </button>
                </div>

                {results && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold">{results.type}</h3>
                    <pre className="mt-2 bg-gray-100 p-4 rounded overflow-auto">
                      {JSON.stringify(results.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}