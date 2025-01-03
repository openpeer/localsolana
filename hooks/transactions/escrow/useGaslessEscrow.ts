// hooks/transactions/escrow/useGaslessEscrow.ts

/* eslint-disable no-mixed-spaces-and-tabs */
import { useState } from "react";
import { useAccount } from "hooks";
import { toast } from "react-toastify";
import { UseGaslessEscrowFundsProps } from "../types";
import { PublicKey } from "@solana/web3.js";
import useShyft from "../useShyft";
import useLocalSolana from "../useLocalSolana";
// import useHelius from "../useHelius"; // Added Helius integration

interface Data {
  hash?: string;
}

const useGaslessEscrow = ({
  contract,
  orderID,
  buyer,
  seller,
  token,
  amount,
  instantEscrow,
  sellerWaitingTime,
}: UseGaslessEscrowFundsProps) => {
  const [data, updateData] = useState<Data>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { address } = useAccount();
  const { depositFundsEscrow, getEscrowPDA } = useLocalSolana();
  const { getAccountInfo } = useShyft(); // Using Helius for account validation
  const { shyft, sendTransactionWithShyft } = useShyft();

  if (!shyft) {
    console.error("Shyft not initialized");
    return {
      isFetching: false,
      gaslessEnabled: false,
      isSuccess,
      isLoading,
      data,
    };
  }

  const escrowFunds = async () => {
    try {
      setIsLoading(true);

      const escrowPDA = await getEscrowPDA(orderID);
      if (!escrowPDA) {
        console.error("Error retrieving escrow PDA");
        setIsLoading(false);
        setIsSuccess(false);
        return;
      }

      //console.log("Escrow PDA:", escrowPDA.toBase58());

      // Validate Escrow Account Existence using Helius
      const escrowAccountInfo = await getAccountInfo(escrowPDA.toBase58());
      if (!escrowAccountInfo) {
        console.error("Escrow account does not exist");
        setIsLoading(false);
        setIsSuccess(false);
        return;
      }

      const transaction = await depositFundsEscrow(
        amount,
        new PublicKey(seller),
        new PublicKey(token.address),
        orderID,
        token.decimals
      );

      if (!transaction) {
        console.error("Failed to create escrow deposit transaction");
        setIsLoading(false);
        setIsSuccess(false);
        return;
      }

      //console.log("Deposit Transaction Prepared:", transaction);

      // Use Shyft for transaction relaying
      const finalTx = await sendTransactionWithShyft(transaction, true,orderID);
      if (finalTx) {
        //console.log("Transaction Successful:", finalTx);
        updateData({ hash: escrowPDA.toBase58() });
        setIsSuccess(true);
      } else {
        console.error("Error relaying transaction through Shyft");
        setIsSuccess(false);
      }
    } catch (error: any) {
      toast.error(error.message, {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
      console.error("Error during escrow funding process:", error);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const prepareTransaction = async () => {
    console.log("Preparing Escrow Transaction:", {
      seller,
      buyer,
      amount,
      tokenAddress: token.address,
      orderID,
      instantEscrow,
      contract
    });
    
    // Get escrow state if needed
    const escrowPDA = await getEscrowPDA(orderID);
    if (escrowPDA) {
      const escrowAccountInfo = await getAccountInfo(escrowPDA.toBase58());
      console.log("Current Escrow State:", escrowAccountInfo);
    }
  };

  return {
    isFetching: false,
    gaslessEnabled: true,
    isLoading,
    isSuccess,
    data,
    escrowFunds,
  };
};

export default useGaslessEscrow;
