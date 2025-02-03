// hooks/transactions/useWithdrawFunds.ts

import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useState } from "react";
import { ErrorBoundary, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { UseDepositFundsProps } from "./types";
import useLocalSolana from "./useLocalSolana";
import useShyft from "./useShyft";
// import useHelius from './useHelius';

interface Data {
  hash?: string;
}

const useWithdrawFunds = ({
  contract,
  token,
  amount,
}: UseDepositFundsProps) => {
  const [data, updateData] = useState<Data>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { primaryWallet } = useDynamicContext();
  const { sendTransactionWithShyft } = useShyft();
  const { withdrawFundsFromLocalSolana } = useLocalSolana();
  const { getTokenBalance, getWalletBalance } = useShyft();

  if (!primaryWallet?.address) {
      return {
          isFetching: true,
          gaslessEnabled: false,
          isSuccess,
          isLoading,
          data,
      };
  }

const checkBalance = async () => {
    try {
        if (token.address === PublicKey.default.toBase58()) {
            const balance = await getWalletBalance(contract);
            return balance !== null && balance >= amount;
        }
        const tokenBalanceResponse = await getTokenBalance(contract, token.address);
        return tokenBalanceResponse !== null && tokenBalanceResponse >= amount;
    } catch (error) {
        console.error("Error checking balance:", error);
        return false;
    }
};

  const withdrawFunds = async () => {
      if (!primaryWallet?.address) {
          console.error("Withdraw failed - no wallet address");
          setIsSuccess(false);
          setIsLoading(false);
          return;
      }

      setIsLoading(true);
      console.debug("[useWithdrawFunds] Starting withdrawal:", {
          amount,
          token,
          contract,
          wallet: primaryWallet.address
      });

      try {
          const hasBalance = await checkBalance();
          if (!hasBalance) {
              console.error("Insufficient balance");
              setIsSuccess(false);
              setIsLoading(false);
              return;
          }

          console.debug("[useWithdrawFunds] Balance check passed, constructing transaction");
          
          const tx = await withdrawFundsFromLocalSolana(
              amount,
              new PublicKey(primaryWallet.address),
              new PublicKey(contract),
              new PublicKey(token.address),
              token.decimals
          );

          if (!tx) {
              console.error("[useWithdrawFunds] Failed to construct transaction");
              setIsSuccess(false);
              setIsLoading(false);
              return;
          }

          console.debug("[useWithdrawFunds] Transaction constructed, sending to Shyft");
          
          const finalTx = await sendTransactionWithShyft(tx, true);
          if (finalTx) {
              console.debug("[useWithdrawFunds] Transaction successful:", finalTx);
              setIsLoading(false);
              setIsSuccess(true);
              updateData({ hash: finalTx });
          } else {
              console.error("[useWithdrawFunds] Transaction failed");
              setIsLoading(false);
              setIsSuccess(false);
          }
      } catch (error) {
          console.error("[useWithdrawFunds] Withdrawal failed:", error);
          setIsSuccess(false);
          setIsLoading(false);
      } finally {
          setIsLoading(false);
      }
  };

  return {
      isFetching: false,
      gaslessEnabled: true,
      isLoading,
      isSuccess,
      data,
      withdrawFunds,
  };
};

export default useWithdrawFunds;