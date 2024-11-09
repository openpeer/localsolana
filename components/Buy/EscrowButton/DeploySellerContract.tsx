import useGaslessDeploy from "@/hooks/transactions/deploy/useGaslessDeploy";
import { useTransactionFeedback } from "@/hooks";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Button } from "components";
import TransactionLink from "components/TransactionLink";
import { useAccount, useUserProfile } from "hooks";
import useDeploy from "hooks/transactions/deploy/useDeploy";
import React, { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useTransactionFeedbackModal } from "@/contexts/TransactionFeedContext";

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

  const prevIsSuccessRef = useRef<boolean>(false);

  useEffect(() => {
    console.log('in use effect of DeploySellerContract',isSuccess,data);
      if (isSuccess && !prevIsSuccessRef.current && (data?.escrowPDA!='')) {
		console.log('in use effect of DeploySellerContract',data);
          prevIsSuccessRef.current = true;
          setContractAddress(data?.escrowPDA);
      }
  }, [ isSuccess,data]);

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
