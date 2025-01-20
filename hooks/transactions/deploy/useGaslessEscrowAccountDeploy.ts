// hooks/transactions/deploy/useGaslessEscrowAccountDeploy.ts

import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import useShyft from "../useShyft";
import useLocalSolana from "../useLocalSolana";
import { toast } from "react-toastify";
// import useHelius from "../useHelius";

interface UseGaslessEscrowAccountDeployProps {
  orderId: string;
  seller: string;
  buyer: string;
  amount: number;
  time: number;
  tokenAddress: string;
  tokenDecimal: number;
  instantEscrow: boolean;
  isLocalSigningRequired: boolean;
  fromWallet: boolean;
}

interface Data {
  hash?: string;
}

const useGaslessEscrowAccountDeploy = ({
  orderId,
  seller,
  buyer,
  amount,
  time,
  tokenAddress,
  tokenDecimal,
  instantEscrow,
  isLocalSigningRequired,
  fromWallet,
}: UseGaslessEscrowAccountDeployProps) => {
  const [data, updateData] = useState<Data>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { primaryWallet } = useDynamicContext();
  const { sendTransactionWithShyft } = useShyft();
  const { markAsPaid } = useLocalSolana();

  const {
    getEscrowPDA,
    createEscrowSol,
    createEscrowToken,
    createEscrowSolBuyer,
    createEscrowTokenBuyer,
  } = useLocalSolana();

  const { getAccountInfo } = useShyft();

  const deploy = async () => {
    if (!primaryWallet?.isConnected) {
      const errorMsg = "Wallet is not connected";
      setError(errorMsg);
      toast.error(errorMsg, {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const escrowPDA = await getEscrowPDA(orderId);
      //console.log("Escrow PDA:", escrowPDA?.toBase58());

      // Validate Escrow Account Existence using Helius
      const status = await getAccountInfo(escrowPDA?.toBase58() ?? "");
      if (!status) {
        const transaction =
          tokenAddress === PublicKey.default.toBase58()
            ? fromWallet
              ? await createEscrowSol(
                  orderId,
                  time,
                  amount * 10 ** tokenDecimal,
                  buyer,
                  seller,
                  PublicKey.default.toBase58(),
                  instantEscrow
                )
              : await createEscrowSolBuyer(
                  orderId,
                  time,
                  amount * 10 ** tokenDecimal,
                  buyer,
                  seller,
                  PublicKey.default.toBase58(),
                  instantEscrow
                )
            : fromWallet
            ? await createEscrowToken(
                orderId,
                time,
                amount * 10 ** tokenDecimal,
                buyer,
                seller,
                PublicKey.default.toBase58(),
                tokenAddress,
                instantEscrow,
                fromWallet
              )
            : await createEscrowTokenBuyer(
                orderId,
                time,
                amount * 10 ** tokenDecimal,
                buyer,
                seller,
                PublicKey.default.toBase58(),
                tokenAddress,
                instantEscrow,
                fromWallet
              );

        if (!transaction) {
          throw new Error("Failed to create escrow transaction");
        }

        // Use Shyft for transaction relaying
        const hash = await sendTransactionWithShyft(
          transaction,
          isLocalSigningRequired,
          orderId
        );

        if (hash) {
          //console.log("Transaction successful, Escrow PDA:", escrowPDA?.toBase58());
          updateData({ hash });
          setIsSuccess(true);
        }
      } else {
        //console.log("Escrow account already exists, PDA:", escrowPDA?.toBase58());
        throw new Error("Escrow account already exists");
      }
    } catch (err: any) {
      let errorMessage = "Failed to deploy escrow account";
      
      // Handle simulation errors
      if (err.message?.includes('Transaction simulation failed')) {
        try {
          const errorJson = JSON.parse(err.message.split('Transaction simulation failed: ')[1]);
          if (errorJson.InstructionError?.[1]?.Custom === 1) {
            errorMessage = 'Transaction simulation failed: {"InstructionError":[0,{"Custom":1}]}';
            toast.error('Insufficient USDT balance', {
              theme: "dark",
              position: "top-right",
              autoClose: 5000,
            });
          } else if (errorJson.InstructionError) {
            errorMessage = 'Transaction rejected: Invalid instruction parameters';
            toast.error('Transaction rejected', {
              theme: "dark",
              position: "top-right",
              autoClose: 5000,
            });
          }
        } catch (parseError) {
          console.error('Error parsing simulation error:', parseError);
        }
      } 
      // Handle other common errors
      else if (err.message?.includes('insufficient balance')) {
        errorMessage = 'Insufficient SOL balance to pay for transaction fees';
        toast.error('Insufficient SOL balance', {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
        });
      } else if (err.message?.includes('blockhash not found')) {
        errorMessage = 'Network error: Please try again';
        toast.error('Network error', {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
        });
      } else if (err.message?.includes('Token account not found')) {
        errorMessage = 'Token account not found. Please ensure you have received USDT before creating an escrow.';
        toast.error('Token account not found', {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
        });
      } else if (err.message) {
        errorMessage = err.message;
        toast.error('Transaction failed', {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
        });
      }

      setError(errorMessage);
      console.error("Deploy error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFetching,
    gaslessEnabled: true,
    isLoading,
    isSuccess,
    error,
    data,
    deploy,
  };
};

export default useGaslessEscrowAccountDeploy;
