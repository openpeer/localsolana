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
    if (!primaryWallet?.isConnected) return;

    setIsLoading(true);

    try {
      const escrowStatePDA =  getEscrowStatePDA(primaryWallet?.address);
      console.log(escrowStatePDA?.toBase58());
      const status = await getAccountInfo(escrowStatePDA?.toBase58() ?? "");
      var result = null;
      if (status == null || status == undefined) {
        const transaction = await initialiseSolanaAccount(
          primaryWallet?.address
        );
        result = await sendTransactionWithShyft(transaction,false);
        console.log(`Shyft Transaction result: ${result}`);
      }
      if ((status==null|| status == undefined)&& (result==undefined || result == null)) {
        console.log(`Status ${status}`);
        setIsSuccess(false);
      } else {
        console.log(`Status ${result}`);
        updateData({ hash: result ?? undefined, escrowPDA: escrowStatePDA?.toBase58() || "" });
        setIsSuccess(true);
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

export default useGaslessDeploy;
