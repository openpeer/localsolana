// hooks/transactions/deploy/useGaslessEscrowAccountDeploy.ts

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
import CreateEscrowAccount from "@/components/Buy/EscrowButton/CreateEscrowAccount";
import { list } from "postcss";

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
  const { sendTransactionWithShyft, getAccountInfo } = useShyft();
  const {
    getEscrowPDA,
    createEscrowSol,
    createEscrowToken,
    createEscrowSolBuyer,
    createEscrowTokenBuyer,
  } = useLocalSolana();

  const deploy = async () => {
    if (!primaryWallet?.isConnected) return;

    setIsLoading(true);

    try {
      const escrowPDA = await getEscrowPDA(orderId);
      console.log(escrowPDA?.toBase58());
      const status = await getAccountInfo(escrowPDA?.toBase58() ?? "");
      if (status == null || status == undefined) {
        if (tokenAddress == PublicKey.default.toBase58()) {
          const transaction = fromWallet
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
              );
          const finalTx = await sendTransactionWithShyft(
            transaction,
            isLocalSigningRequired
          );
          console.log(`Status ${status}`);
          if (finalTx !== undefined) {
            setIsLoading(false);
            setIsSuccess(true);
            updateData({ hash: escrowPDA?.toBase58() });
          } else {
            console.error("error", finalTx);
            setIsLoading(false);
            setIsSuccess(false);
          }
        } else {
          const transaction = fromWallet
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
          if (transaction == null) {
            setIsLoading(false);
            setIsSuccess(false);
            return;
          }
          const finalTx = await sendTransactionWithShyft(
            transaction,
            isLocalSigningRequired
          );
          console.log(`Status ${status}`);
          if (finalTx !== undefined) {
            setIsLoading(false);
            setIsSuccess(true);
            updateData({ hash: escrowPDA?.toBase58() });
          } else {
            console.error("error", finalTx);
            setIsLoading(false);
            setIsSuccess(false);
          }
        }
      } else {
        setIsLoading(false);
        setIsSuccess(true);
        updateData({ hash: escrowPDA?.toBase58() });
      }
    } catch (error) {
      console.error("Deployment failed", error);
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
