// hooks/transactions/deploy/useGaslessEscrowAccountDeploy.ts

import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import useShyft from "../useShyft";
import useLocalSolana from "../useLocalSolana";
import useHelius from "../useHelius";

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

  const { primaryWallet } = useDynamicContext();
  const { sendTransactionWithShyft } = useShyft();

  const {
    getEscrowPDA,
    createEscrowSol,
    createEscrowToken,
    createEscrowSolBuyer,
    createEscrowTokenBuyer,
  } = useLocalSolana();

  const { getAccountInfo } = useHelius();

  const deploy = async () => {
    if (!primaryWallet?.isConnected) {
      console.error("Primary wallet is not connected");
      return;
    }

    setIsLoading(true);

    try {
      const escrowPDA = await getEscrowPDA(orderId);
      console.log("Escrow PDA:", escrowPDA?.toBase58());

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
          console.error("Failed to create escrow transaction");
          setIsLoading(false);
          setIsSuccess(false);
          return;
        }

        // Use Shyft for transaction relaying
        const finalTx = await sendTransactionWithShyft(
          transaction,
          isLocalSigningRequired
        );

        if (finalTx) {
          console.log("Transaction successful, Escrow PDA:", escrowPDA?.toBase58());
          updateData({ hash: escrowPDA?.toBase58() });
          setIsSuccess(true);
        } else {
          console.error("Transaction relaying failed", finalTx);
          setIsSuccess(false);
        }
      } else {
        console.log("Escrow account already exists, PDA:", escrowPDA?.toBase58());
        updateData({ hash: escrowPDA?.toBase58() });
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Deployment failed:", error);
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

export default useGaslessEscrowAccountDeploy;
