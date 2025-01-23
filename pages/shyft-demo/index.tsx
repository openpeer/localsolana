'use client';

import { useState } from 'react';
import useShyft from '@/hooks/transactions/useShyft';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { toast } from 'react-toastify';

export default function SolanaRPCDemo() {
  const [walletAddress, setWalletAddress] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('0.1');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const {
    connection,
    sendTransactionWithShyft,
    getWalletBalance,
    getTokenBalance,
    getAllTokenBalance,
    getAccountInfo
  } = useShyft();

  const isValidPublicKey = (address: string) => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleGetSOLBalance = async () => {
    if (!isValidPublicKey(walletAddress)) {
      toast.error('Invalid wallet address');
      return;
    }

    setLoading(true);
    try {
      const balance = await getWalletBalance(walletAddress);
      setResults({ 
        type: 'SOL Balance',
        balance: `${balance} SOL` 
      });
      toast.success('SOL balance fetched successfully!');
    } catch (error) {
      toast.error('Error fetching SOL balance');
    }
    setLoading(false);
  };

  const handleGetTokenBalance = async () => {
    if (!isValidPublicKey(walletAddress) || !isValidPublicKey(tokenAddress)) {
      toast.error('Invalid wallet or token address');
      return;
    }

    setLoading(true);
    try {
      const balance = await getTokenBalance(walletAddress, tokenAddress);
      setResults({ 
        type: 'Token Balance',
        balance: balance 
      });
      toast.success('Token balance fetched successfully!');
    } catch (error) {
      toast.error('Error fetching token balance');
    }
    setLoading(false);
  };

  const handleGetAllTokens = async () => {
    if (!isValidPublicKey(walletAddress)) {
      toast.error('Invalid wallet address');
      return;
    }

    setLoading(true);
    try {
      const balances = await getAllTokenBalance(walletAddress);
      setResults({
        type: 'All Token Balances',
        balances
      });
      toast.success('All token balances fetched successfully!');
    } catch (error) {
      toast.error('Error fetching token balances');
    }
    setLoading(false);
  };

  const handleCreateTestTransaction = async () => {
    if (!isValidPublicKey(walletAddress)) {
      toast.error('Invalid sender wallet address');
      return;
    }

    if (!isValidPublicKey(recipientAddress)) {
      toast.error('Invalid recipient address');
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      // Create new transaction
      const transaction = new Transaction();

      // Add SOL transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(walletAddress),
          toPubkey: new PublicKey(recipientAddress),
          lamports: Math.floor(parseFloat(amount) * 1e9),
        })
      );

      // Send transaction via RPC
      const txResult = await sendTransactionWithShyft(transaction, true);
      const method = 'solana-rpc';

      if (txResult) {
        // Convert signature if it's in character array format
        const signature = typeof txResult === 'object' && Object.keys(txResult).length > 87 
          ? Object.values(txResult).slice(0, 88).join('')
          : txResult.toString();

        // Generate explorer links for both environments
        const explorerLinks = {
          mainnet: `https://explorer.solana.com/tx/${signature}`,
          devnet: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
        };

        setResults({
          type: 'Transaction',
          status: 'Success',
          details: {
            signature,
            method,
            transaction: {
              from: walletAddress,
              to: recipientAddress,
              amount: `${amount} SOL`,
              lamports: Math.floor(parseFloat(amount) * 1e9)
            },
            explorerLinks
          }
        });
        
        toast.success('Transaction completed successfully!');
      } else {
        toast.error('Transaction failed');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(error instanceof Error ? error.message : 'Error creating/sending transaction');
    }
    setLoading(false);
  };

  const handleGetAccountInfo = async () => {
    if (!isValidPublicKey(walletAddress)) {
      toast.error('Invalid wallet address');
      return;
    }

    setLoading(true);
    try {
      const accountInfo = await getAccountInfo(walletAddress);
      if (accountInfo) {
        setResults({
          type: 'Account Info',
          info: {
            executable: accountInfo.executable,
            lamports: accountInfo.lamports,
            owner: accountInfo.owner.toBase58(),
            rentEpoch: accountInfo.rentEpoch,
            size: accountInfo.data.length
          }
        });
        toast.success('Account information fetched successfully!');
      } else {
        toast.error('Account not found');
      }
    } catch (error) {
      toast.error('Error fetching account info');
    }
    setLoading(false);
  };

    // Helper function to render explorer links
    const renderExplorerLinks = (links: { mainnet: string; devnet: string }) => {
      return (
        <div className="mt-2 space-y-1">
          <p className="font-semibold">View on Solana Explorer:</p>
          <div className="space-y-1">
            <a 
              href={links.mainnet}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 block"
            >
              Mainnet Beta ↗
            </a>
            <a 
              href={links.devnet}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 block"
            >
              Devnet ↗
            </a>
          </div>
        </div>
      );
    };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Solana RPC Demo</h1>

      <div className="space-y-8">
        {/* Wallet Information Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Information</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Enter token address (for token balance)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleGetSOLBalance}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get SOL Balance
              </button>
              <button
                onClick={handleGetTokenBalance}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Token Balance
              </button>
              <button
                onClick={handleGetAllTokens}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get All Tokens
              </button>
              <button
                onClick={handleGetAccountInfo}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Account Info
              </button>
            </div>
          </div>
        </div>

        {/* Test Transaction Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Transaction</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Sender wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Recipient wallet address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Amount in SOL"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateTestTransaction}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send SOL
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          {loading ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : results ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Transaction Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Status:</span> {results.status}</p>
                  <p><span className="font-medium">Method:</span> {results.details?.method}</p>
                  {results.details?.transaction && (
                    <>
                      <p><span className="font-medium">From:</span> {results.details.transaction.from}</p>
                      <p><span className="font-medium">To:</span> {results.details.transaction.to}</p>
                      <p><span className="font-medium">Amount:</span> {results.details.transaction.amount}</p>
                    </>
                  )}
                  {results.details?.signature && (
                    <>
                      <p className="font-medium">Signature:</p>
                      <p className="break-all text-sm font-mono bg-gray-100 p-2 rounded">
                        {results.details.signature}
                      </p>
                    </>
                  )}
                  {results.details?.explorerLinks && renderExplorerLinks(results.details.explorerLinks)}
                </div>
              </div>
              <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-sm font-mono">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-500">No results to display</p>
          )}
        </div>
      </div>
    </div>
  );
}