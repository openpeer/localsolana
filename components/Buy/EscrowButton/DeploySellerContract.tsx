import useGaslessDeploy from "@/hooks/transactions/deploy/useGaslessDeploy";
import { useTransactionFeedback } from "@/hooks";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Button } from "components";
import TransactionLink from "components/TransactionLink";
import { useAccount } from "hooks";
import React, { useEffect, useRef } from "react";

const DeploySellerContract = ({
  label = "Create LocalSolana Account",
  setContractAddress
}: {
  label?: string;
  setContractAddress: (address: string | undefined) => void; 
}) => {
  const { primaryWallet } = useDynamicContext();
  const { isFetching, isLoading, isSuccess, data, deploy } = useGaslessDeploy();

  useTransactionFeedback({
    hash: data?.hash,
    isSuccess,
    Link: <TransactionLink hash={data?.hash} />,
    description: "Deployed the LocalSolana Account",
  });

  const deploySellerContract = async () => {
    if (!primaryWallet?.isConnected) return;
    await deploy?.();
  };

  // Single useEffect to handle contract address updates
  useEffect(() => {
    const handleContractDeployment = async () => {
      if (isSuccess && data?.escrowPDA) {
        try {
          // Wait briefly to ensure blockchain state is updated
          await new Promise(resolve => setTimeout(resolve, 2000));
          setContractAddress(data.escrowPDA);
        } catch (error) {
          console.error("Error updating contract address:", error);
        }
      }
    };

    handleContractDeployment();
  }, [isSuccess, data?.escrowPDA, setContractAddress]);

  return (
    <Button
      title={isLoading ? "Processing..." : isSuccess ? "Done" : label}
      onClick={deploySellerContract}
      processing={isLoading || isFetching}
      disabled={isSuccess || isFetching || isLoading}
    />
  );
};

export default DeploySellerContract;
