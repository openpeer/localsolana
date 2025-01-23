/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import useShyft from './useShyft';

interface TokenBalanceInfo {
  address: string;
  balance: number;
  mint: string;
  decimals: number;
}

const POLL_INTERVAL = 15000; // 15 seconds

/**
 * Custom hook to fetch and monitor all token balances for a Solana address
 * @param address - The Solana wallet address to check balances for
 * @param watch - If true, polls for balance updates every 15 seconds
 * @param refreshTrigger - Increment this value to force a balance refresh
 */
export const useAllTokenBalance = (
  address: string | undefined,
  watch = false,
  refreshTrigger = 0
) => {
  const [balances, setBalances] = useState<TokenBalanceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAllTokenBalance } = useShyft();

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchBalances = async () => {
      if (!address) {
        setBalances([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getAllTokenBalance(address);
        
        if (mounted) {
          setBalances(result);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useAllTokenBalance] Error fetching balances:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch token balances');
          setBalances([]);
          setLoading(false);
        }
      }
    };

    fetchBalances();

    if (watch) {
      pollInterval = setInterval(fetchBalances, POLL_INTERVAL);
    }

    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [address, watch, refreshTrigger, getAllTokenBalance]);

  return { balances, loading, error };
};