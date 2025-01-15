// hooks/transactions/useContractRead.ts

/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import useLocalSolana from "./useLocalSolana";
import { BN } from "@coral-xyz/anchor";
import useAccount from "../useAccount";
import useShyft from "./useShyft";

// Debug logging utility that only logs in development
const debugLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(...args);
  }
};

interface EscrowStateData {
  seller: string;
  [key: string]: any;
}

interface TokenAccount {
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
          tokenAmount: {
            amount: string;
            decimals: number;
            uiAmount: number;
          };
        };
      };
    };
  };
}

export const useContractRead = (contractAddress: string | EscrowStateData, method: string, watch?: boolean) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<{ [key: string]: string }>({});
  const [solBalance, setSolBalance] = useState<number>(0);

  const { connection } = useLocalSolana();
  const { shyft } = useShyft();

  const contractAddressStr = typeof contractAddress === 'string' ? contractAddress : contractAddress.seller;

  const processTokenAccounts = useCallback((accounts: TokenAccount[]) => {
    const newTokenBalances: { [key: string]: string } = {};
    const balanceLog: { mint: string; uiAmount: number; raw: string }[] = [];

    accounts.forEach((account: TokenAccount) => {
      try {
        const mintAddress = account.account.data.parsed.info.mint;
        const balance = account.account.data.parsed.info.tokenAmount.amount;
        const uiAmount = account.account.data.parsed.info.tokenAmount.uiAmount;
        
        newTokenBalances[mintAddress] = balance;
        balanceLog.push({ mint: mintAddress, uiAmount, raw: balance });
      } catch (err) {
        console.error("[useContractRead] Error parsing token account:", err);
      }
    });

    // Single consolidated log for all token balances
    if (balanceLog.length > 0) {
      debugLog("[useContractRead] Token balances:", balanceLog);
    }

    return newTokenBalances;
  }, []);

  const fetchData = useCallback(async () => {
    if (!contractAddressStr || !method) {
      debugLog("[useContractRead] Missing required parameters:", { contractAddressStr, method });
      setError("Missing contract address or method");
      setLoading(false);
      return;
    }

    if (!connection) {
      debugLog("[useContractRead] Waiting for connection...");
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let publicKey: PublicKey;
      try {
        publicKey = new PublicKey(contractAddressStr);
      } catch (err) {
        console.error("[useContractRead] Invalid public key:", contractAddressStr);
        setError("Invalid contract address");
        return;
      }

      let decodedData: any = null;

      switch (method) {
        case "escrowState":
          try {
            const newSolBalance = await connection.getBalance(publicKey);
            if (newSolBalance !== solBalance) {
              debugLog(`[useContractRead] SOL balance updated: ${newSolBalance / LAMPORTS_PER_SOL} SOL`);
              setSolBalance(newSolBalance);
            }

            const escrowStateTokenAccounts = await connection.getParsedTokenAccountsByOwner(
              publicKey,
              { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
            );

            if (!escrowStateTokenAccounts?.value?.length) {
              debugLog("[useContractRead] No token accounts found");
              setTokenBalances({});
            } else {
              const newTokenBalances = processTokenAccounts(escrowStateTokenAccounts.value);
              
              // Only update if balances have changed
              if (JSON.stringify(newTokenBalances) !== JSON.stringify(tokenBalances)) {
                setTokenBalances(newTokenBalances);
              }
            }

            decodedData = {
              seller: contractAddressStr,
              tokenBalances: tokenBalances,
              solBalance: newSolBalance
            };
          } catch (err: any) {
            console.error("[useContractRead] Error fetching escrow state:", err);
            setError(err?.message || "Error fetching escrow state");
            return;
          }
          break;

        default:
          setError(`Unsupported method: ${method}`);
          return;
      }

      if (decodedData) {
        setData(decodedData);
        setError(null);
      }
    } catch (err: any) {
      console.error("[useContractRead] Error fetching data:", err);
      setError(err?.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  }, [contractAddressStr, method, connection, processTokenAccounts, solBalance, tokenBalances]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    fetchData();

    if (watch) {
      pollInterval = setInterval(fetchData, 8000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [fetchData, watch]);

  return { data, loading, error, tokenBalances, solBalance };
};

export default useContractRead;
