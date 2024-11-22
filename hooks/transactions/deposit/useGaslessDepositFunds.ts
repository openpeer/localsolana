// hooks/transactions/deposit/useGaslessDepositFunds.ts

import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { useState } from "react";
import { ErrorBoundary, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { UseDepositFundsProps } from "../types";
import useLocalSolana from "../useLocalSolana";
import { web3 } from "@coral-xyz/anchor";
import useShyft from "../useShyft";
//import { Shyft } from '@shyft-to/js';
import useHelius from "../useHelius";


interface Data {
  hash?: string | null;
}

const useGaslessDepositFunds = ({
  contract,
  token,
  amount,
}: UseDepositFundsProps) => {
  const [data, updateData] = useState<Data>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { primaryWallet } = useDynamicContext();
  const { sendTransactionWithShyft, shyft } = useShyft();
  const { getAccountInfo } = useHelius()
  const { depositFundsToLocalSolana } = useLocalSolana();

  if (!primaryWallet?.address) {
    return {
      isFetching: true,
      gaslessEnabled: false,
      isSuccess,
      isLoading,
      data,
    };
  }

  const depositFunds = async () => {
    if (!primaryWallet?.address) {
        console.error("Deposit failed: Primary wallet address not available");
        setIsSuccess(false);
        setIsLoading(false);
        return;
      }

    setIsLoading(true);
    console.log("Initiating deposit");

    try {
      const senderAccountInfo = await getAccountInfo(primaryWallet.address);
      if (!senderAccountInfo) {
        console.error("Sender account not found");
        setIsSuccess(false);
        setIsLoading(false);
        return;
      }

      if (token.address === PublicKey.default.toBase58()) {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(primaryWallet.address),
            toPubkey: new PublicKey(contract),
            lamports: Number(amount),
          })
        );

        // Shyft used only for transaction relaying
        if (!shyft) {
          console.error("Shyft not initialized for transaction relaying");
          setIsSuccess(false);
          setIsLoading(false);
          return;
        }

        const finalTx = await sendTransactionWithShyft(transaction,true);
        if (finalTx) {
          setIsSuccess(true);
          updateData({ hash: finalTx });
        } else {
          console.error("Transaction relaying failed", finalTx);
          setIsSuccess(false);
        }

      } else {
        const tx = await depositFundsToLocalSolana(
          amount,
          new PublicKey(primaryWallet?.address),
          new PublicKey(contract),
          new PublicKey(token.address)
        );

        if (!tx || !shyft) {
          console.error("Deposit failed: Missing transaction or Shyft instance", tx, shyft);
          setIsSuccess(false);
          setIsLoading(false);
          return;
        }

          const finalTx = await sendTransactionWithShyft(tx,true);
          if (finalTx) {
            setIsSuccess(true);
            updateData({ hash: finalTx });
          } else {
            console.error("Transaction relaying failed", finalTx);
            setIsSuccess(false);
          }
        }

    } catch (error) {
      console.error("Deposit operation failed", error);
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
    depositFunds,
  };
};

export default useGaslessDepositFunds;
