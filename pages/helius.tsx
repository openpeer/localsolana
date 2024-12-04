import React, { useState } from 'react';
import useHelius from '@/hooks/transactions/useHelius';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

export default function HeliusTest() {
  const {
    helius,
    connection,
    sendTransaction,
    getWalletBalance,
    getTokenBalance,
    getAllTokenBalances,
    getAccountInfo
  } = useHelius();

  const [address, setAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (action: string) => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      switch (action) {
        case 'balance':
          const balance = await getWalletBalance(address);
          setResult({ balance: balance ? balance / 1e9 : 0 });
          break;

        case 'tokenBalance':
          const tokenInfo = await getTokenBalance(address, tokenAddress);
          setResult(tokenInfo);
          break;

        case 'allTokens':
          const allTokens = await getAllTokenBalances(address);
          setResult(allTokens);
          break;

        case 'accountInfo':
          const info = await getAccountInfo(address);
          setResult(info);
          break;

        case 'testTransaction':
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: new PublicKey(address),
              toPubkey: new PublicKey(address),
              lamports: 100
            })
          );
          const signature = await sendTransaction(transaction, true);
          setResult({ signature });
          break;
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Helius API Test Suite</h1>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Wallet Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter Solana address"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Token Address (Optional)</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter token address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <button
              onClick={() => handleSubmit('balance')}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Get SOL Balance
            </button>
            
            <button
              onClick={() => handleSubmit('tokenBalance')}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Get Token Balance
            </button>
            
            <button
              onClick={() => handleSubmit('allTokens')}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Get All Tokens
            </button>
            
            <button
              onClick={() => handleSubmit('accountInfo')}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Get Account Info
            </button>
            
            <button
              onClick={() => handleSubmit('testTransaction')}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Transaction
            </button>
          </div>

          {loading && (
            <div className="text-center p-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}