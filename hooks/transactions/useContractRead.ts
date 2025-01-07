/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import useLocalSolana from "./useLocalSolana";
import { BN } from "@coral-xyz/anchor";
import useAccount from "../useAccount";
import useShyft from "./useShyft";

export const useContractRead = (contractAddress: string, method: string, watch?: boolean) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<{ [key: string]: string }>({});
  const [solBalance, setSolBalance] = useState<number>(0);
  const { connection, program, getEscrowStatePDA } = useLocalSolana();

  useEffect(() => {
    const fetchData = async () => {
      console.debug("[useContractRead] Starting fetch for", { contractAddress, method });
      setLoading(true);
      setError(null);

      if (contractAddress == '') {
        console.debug("[useContractRead] Empty contract address");
        setData(null);
        setLoading(false);
        return;
      }

      var escrowStateAddress;
      if (method == "escrowState") {
        escrowStateAddress = getEscrowStatePDA(contractAddress);
        console.debug('[useContractRead] LocalSolana Account', escrowStateAddress?.toBase58());
        
        if (!escrowStateAddress) {
          console.debug("[useContractRead] Unable to find LocalSolana account");
          setData(null);
          setLoading(false);
          setError('Unable to find LocalSolana account');
          return;
        }
      }

      if (!escrowStateAddress && !contractAddress) {
        console.debug("[useContractRead] Error in address");
        setError('Error in address');
        setData(null);
        setLoading(false);
        return;
      }

      const publicKey = method == "escrowState" ? escrowStateAddress : new PublicKey(contractAddress);
      try {
        if (!connection) {
          console.debug("[useContractRead] No connection available");
          setError("Connection not found");
          setLoading(false);
          return;
        }

        if (!publicKey) {
          console.debug("[useContractRead] No public key available");
          setError("Public key not found");
          setLoading(false);
          return;
        }

        console.debug("[useContractRead] Fetching account info for", publicKey.toBase58());
        const accountInfo = await connection.getAccountInfo(publicKey!);
        const accountBuffer = accountInfo?.data;

        if (!accountBuffer) {
          console.debug("[useContractRead] No account buffer found");
          setError("Unable to retrieve account information");
          setLoading(false);
          return;
        }

        var decodedData;
        switch (method) {
          case "escrow":
            try {
              decodedData = program?.account.escrow.coder.accounts.decode(
                "escrow",
                accountBuffer
              );
              console.debug("[useContractRead] Decoded escrow data:", decodedData);
            } catch (err) {
              console.error("[useContractRead] Error decoding escrow:", err);
            }
            break;

          case "fee":
            try {
              var decodedEscrowData =
                program?.account.escrow.coder.accounts.decode(
                  "escrow",
                  accountBuffer
                );
              decodedData = decodedEscrowData.fee ?? new BN(0);
              console.debug("[useContractRead] Decoded fee data:", decodedData);
            } catch (err: any) {
              console.error("[useContractRead] Error decoding fee:", err);
              setError(err?.toString());
              setData(null);
            }
            break;

          case "escrowState":
            try {
              console.debug("[useContractRead] Attempting to decode escrow state");
              const decodedEscrowStateData =
                program?.account.escrowState.coder.accounts.decode(
                  "escrowState",
                  accountBuffer
                );
              
              console.debug("[useContractRead] Raw escrow state data:", JSON.stringify(decodedEscrowStateData, null, 2));
              
              if (decodedEscrowStateData) {
                // Get the escrow state PDA's token accounts
                const escrowStateTokenAccounts = await connection.getParsedTokenAccountsByOwner(
                  publicKey,
                  { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
                );

                console.debug("[useContractRead] Token accounts:", escrowStateTokenAccounts);

                // Extract balances from token accounts
                const newTokenBalances: { [key: string]: string } = {};
                escrowStateTokenAccounts.value.forEach(account => {
                  const mintAddress = account.account.data.parsed.info.mint;
                  const balance = account.account.data.parsed.info.tokenAmount.amount;
                  const decimals = account.account.data.parsed.info.tokenAmount.decimals;
                  const uiAmount = account.account.data.parsed.info.tokenAmount.uiAmount;
                  console.debug(`[useContractRead] Token balance for ${mintAddress}: ${uiAmount} (${balance} raw)`);
                  newTokenBalances[mintAddress] = balance;
                });
                setTokenBalances(newTokenBalances);

                // Get SOL balance
                const newSolBalance = await connection.getBalance(publicKey);
                console.debug(`[useContractRead] SOL balance: ${newSolBalance / 1e9} SOL (${newSolBalance} lamports)`);
                setSolBalance(newSolBalance);

                decodedData = {
                  ...decodedEscrowStateData,
                  tokenBalances: newTokenBalances,
                  solBalance: newSolBalance
                };
                console.debug("[useContractRead] Full escrow state data with balances:", JSON.stringify(decodedData, null, 2));
              }
            } catch (err: any) {
              console.error("[useContractRead] Error decoding escrow state:", err);
              setError(err?.toString());
              setData(null);
            }
            break;
        }

        if (decodedData) {
          console.debug("[useContractRead] Setting decoded data");
          setData(decodedData);
        } else {
          console.debug("[useContractRead] No decoded data found");
          setError("No data found");
        }
      } catch (err: any) {
        console.error("[useContractRead] Error in contract read:", err);
        setError(err?.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (watch) {
      var escrowStateAddress: PublicKey | undefined;
      if (method == "escrowState") {
        escrowStateAddress = getEscrowStatePDA(contractAddress);
      }
      if (!escrowStateAddress) {
        return;
      }
      const publicKey = method == "escrowState" ? escrowStateAddress : new PublicKey(contractAddress);
      if (publicKey === undefined) {
        return;
      }

      console.debug("[useContractRead] Setting up account change listener for", publicKey.toBase58());
      const subscriptionId = connection?.onAccountChange(publicKey, async (updatedAccountInfo) => {
        console.debug("[useContractRead] Account change detected");
        const accountBuffer = updatedAccountInfo?.data;
        if (!accountBuffer) {
          console.debug("[useContractRead] No account buffer in update");
          setError("Unable to retrieve account information");
          setLoading(false);
          return;
        }

        var decodedData;
        switch (method) {
          case "escrowState":
            try {
              console.debug("[useContractRead] Attempting to decode updated escrow state");
              const decodedEscrowStateData =
                program?.account.escrowState.coder.accounts.decode(
                  "escrowState",
                  accountBuffer
                );
              
              console.debug("[useContractRead] Raw updated escrow state data:", JSON.stringify(decodedEscrowStateData, null, 2));
              
              if (decodedEscrowStateData) {
                // Get the escrow state PDA's token accounts
                const escrowStateTokenAccounts = await connection.getParsedTokenAccountsByOwner(
                  publicKey,
                  { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
                );

                console.debug("[useContractRead] Updated token accounts:", escrowStateTokenAccounts);

                // Extract balances from token accounts
                const newTokenBalances: { [key: string]: string } = {};
                escrowStateTokenAccounts.value.forEach(account => {
                  const mintAddress = account.account.data.parsed.info.mint;
                  const balance = account.account.data.parsed.info.tokenAmount.amount;
                  const decimals = account.account.data.parsed.info.tokenAmount.decimals;
                  const uiAmount = account.account.data.parsed.info.tokenAmount.uiAmount;
                  console.debug(`[useContractRead] Updated token balance for ${mintAddress}: ${uiAmount} (${balance} raw)`);
                  newTokenBalances[mintAddress] = balance;
                });
                setTokenBalances(newTokenBalances);

                // Get SOL balance
                const newSolBalance = await connection.getBalance(publicKey);
                console.debug(`[useContractRead] Updated SOL balance: ${newSolBalance / 1e9} SOL (${newSolBalance} lamports)`);
                setSolBalance(newSolBalance);

                decodedData = {
                  ...decodedEscrowStateData,
                  tokenBalances: newTokenBalances,
                  solBalance: newSolBalance
                };
                console.debug("[useContractRead] Full updated escrow state data with balances:", JSON.stringify(decodedData, null, 2));
              }
            } catch (err: any) {
              console.error("[useContractRead] Error decoding updated escrow state:", err);
              setError(err?.toString());
              setData(null);
            }
            break;
        }

        if (decodedData) {
          console.debug("[useContractRead] Setting updated decoded data");
          setData(decodedData);
        } else {
          console.debug("[useContractRead] No updated decoded data found");
          setError("No data found");
        }
      });

      return () => {
        if (subscriptionId) {
          connection?.removeAccountChangeListener(subscriptionId);
        }
      };
    }
  }, [contractAddress, method, watch, connection, program]);

  return { data, loading, error, tokenBalances, solBalance };
};
