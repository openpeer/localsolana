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
import useHelius from './useHelius';

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
  const { sendTransactionWithShyft, shyft } = useShyft();
  const { withdrawFundsFromLocalSolana } = useLocalSolana();
  const { getTokenBalance, getWalletBalance } = useHelius();

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
              const balance = await getWalletBalance(primaryWallet.address);
              return balance !== null && balance >= amount;
          }
          const tokenBalance = await getTokenBalance(primaryWallet.address, token.address);
          return tokenBalance?.balance ? tokenBalance.balance >= amount : false;
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
      console.log("In Withdraw funds");

      try {
          // Verify balance before proceeding
          const hasBalance = await checkBalance();
          if (!hasBalance) {
              console.error("Insufficient balance");
              setIsSuccess(false);
              setIsLoading(false);
              return;
          }

          // if (token.address == PublicKey.default.toBase58()) {
          //   const transaction = new web3.Transaction().add(
          //     SystemProgram.transfer({
          //       fromPubkey: new PublicKey(primaryWallet.address),
          //       toPubkey: new PublicKey(contract),
          //       lamports: amount* LAMPORTS_PER_SOL,
          //     })
          //   );
          //   if (shyft == null) {
          //     console.error("Shyft is not available");
          //     setIsSuccess(false);
          //     setIsLoading(false);
          //     return;
          //   } else {
          //     try {
          //       const finalTx = await sendTransactionWithShyft(transaction,true);
          //       if (finalTx !== undefined) {
          //         setIsLoading(false);
          //         setIsSuccess(true);
          //         updateData({ hash: finalTx });
          //       } else {
          //         console.error("error", finalTx);
          //         setIsLoading(false);
          //         setIsSuccess(false);
          //       }
          //     } catch (err) {
          //       console.error("error", err);
          //       setIsLoading(false);
          //       setIsSuccess(false);
          //     }
          //   }
          // } else {

          console.log('Withdraw funds from local solana', contract, token.name, token.decimals);

          const tx = await withdrawFundsFromLocalSolana(
              amount,
              new PublicKey(primaryWallet?.address),
              new PublicKey(contract),
              new PublicKey(token.address),
              token.decimals
          );

          if (tx === undefined || shyft == null) {
              console.error("Withdraw failed,", tx, shyft);
              setIsSuccess(false);
              setIsLoading(false);
              return;
          }

          if (tx == null) {
              console.error("error", tx);
              setIsLoading(false);
              setIsSuccess(false);
              return;
          }

          const finalTx = await sendTransactionWithShyft(tx, true);
          if (finalTx !== undefined) {
              setIsLoading(false);
              setIsSuccess(true);
              updateData({ hash: finalTx || "" });
          } else {
              console.error("error", finalTx);
              setIsLoading(false);
              setIsSuccess(false);
          }
          // }
      } catch (error) {
          console.error("Withdraw failed", error);
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