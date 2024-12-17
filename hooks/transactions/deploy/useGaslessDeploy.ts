import { sign } from "./../../../node_modules/tweetnacl/nacl.d";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { useState } from "react";
import {
  useDynamicContext,
  useSmartWallets,
} from "@dynamic-labs/sdk-react-core";
import useShyft from "../useShyft";
import useLocalSolana from "../useLocalSolana";
import { signTransaction } from "viem/accounts";
import { result } from "lodash";

interface UseGaslessDeployProps {
  contract: string;
}

interface Data {
  hash?: string;
  escrowPDA: string
}

const useGaslessDeploy = () => {
  const [data, updateData] = useState<Data>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { primaryWallet } = useDynamicContext();
  const { sendTransactionWithShyft, getAccountInfo } = useShyft();
  const {
    initialiseSolanaAccount,
    getEscrowStatePDA,
  } = useLocalSolana();

  const deploy = async () => {
    if (!primaryWallet?.isConnected) {
      console.log("Primary wallet not connected", primaryWallet);
      return;
    }

    setIsLoading(true);

    try {
      console.log("Starting deployment with wallet address:", primaryWallet.address);
      
      const escrowStatePDA = getEscrowStatePDA(primaryWallet?.address);
      if (!escrowStatePDA) {
        console.error("Failed to generate escrowStatePDA");
        setIsSuccess(false);
        return;
      }
      console.log("Generated escrowStatePDA:", escrowStatePDA.toBase58());
      
      console.log("Initializing Solana account...");
      const transaction = await initialiseSolanaAccount(primaryWallet?.address);
      if (!transaction) {
        console.error("Failed to create initialization transaction");
        setIsSuccess(false);
        return;
      }
      console.log("Generated transaction:", {
        feePayer: transaction.feePayer?.toBase58(),
        recentBlockhash: transaction.recentBlockhash,
        instructions: transaction.instructions.length
      });
      
      console.log("Sending transaction to Shyft...");
      const result = await sendTransactionWithShyft(transaction, false);
      console.log("Shyft transaction result:", result);

      if (!result) {
        console.log("Transaction failed - no result");
        setIsSuccess(false);
      } else {
        console.log("Transaction succeeded:", {
          hash: result,
          escrowPDA: escrowStatePDA.toBase58()
        });
        updateData({ 
          hash: result, 
          escrowPDA: escrowStatePDA.toBase58() 
        });
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Deployment failed with error:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack
        });
      }
      setIsSuccess(false);
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
    deploy,
  };
};

export default useGaslessDeploy;
