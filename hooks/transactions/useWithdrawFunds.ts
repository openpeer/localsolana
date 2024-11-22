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
  
    if (!primaryWallet?.address) {
      return {
        isFetching: true,
        gaslessEnabled: false,
        isSuccess,
        isLoading,
        data,
      };
    }
  
    const withdrawFunds = async () => {
      if (!primaryWallet?.address) {
          console.error("Deposit failed");
          setIsSuccess(false);
          setIsLoading(false);
          
          return;}
  
      setIsLoading(true);
      console.log("In Withdraw funds");
      try {
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
            console.log('Withdraw funds from local solana',contract,token.name,token.decimals);
          
          const tx = await withdrawFundsFromLocalSolana(
            amount,
            new PublicKey(primaryWallet?.address),
            new PublicKey(contract),
            new PublicKey(token.address),
            token.decimals 
          );
          if (tx === undefined || shyft == null) {
            console.error("Deposit failed,", tx, shyft);
            setIsSuccess(false);
            setIsLoading(false);
            return;
          } else {
            if (tx == null) {
              console.error("error", tx);
              setIsLoading(false);
              setIsSuccess(false);
              return;
            }
            const finalTx = await sendTransactionWithShyft(tx,true);
            if (finalTx !== undefined) {
              setIsLoading(false);
              setIsSuccess(true);
              updateData({ hash: finalTx || "" });
            } else {
              console.error("error", finalTx);
              setIsLoading(false);
              setIsSuccess(false);
            }
          }
       // }
      } catch (error) {
        console.error("Deposit failed", error);
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
  