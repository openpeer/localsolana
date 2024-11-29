// import { OpenPeerEscrow } from 'abis';
import { useBalance } from "@/hooks/transactions/useBalance";
import { useContractRead } from "@/hooks/transactions/useContractRead";
import useOpenDispute from "@/hooks/transactions/useOpenDispute";
import { BN } from "@coral-xyz/anchor";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { Button, Modal } from "components";
import TransactionLink from "components/TransactionLink";
import { useTransactionFeedback, useAccount } from "hooks"; //useOpenDispute
import { Order } from "models/types";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface OpenDisputeButtonParams {
  order: Order;
  outlined?: boolean;
  title?: string;
  disabledProp?: boolean,
  updateFormDetails?: boolean,
  onContinue?: (statusUpdated?: boolean) => Promise<void>;
}

const OpenDisputeButton = ({
  order,
  outlined = true,
  title = "Open a dispute",
  disabledProp = false,
  updateFormDetails = false,
  onContinue
}: OpenDisputeButtonParams) => {
  const {
    buyer,
    seller,
    trade_id: tradeId,
    token_amount: tokenAmount,
    list,
    status
  } = order;
  const { token } = list;
  const { isConnected, address: connectedAddress } = useAccount();
  const isBuyer = buyer.address === connectedAddress;
  const isSeller = seller.address === connectedAddress;

  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [disputeConfirmed, setDisputeConfirmed] = useState(false)
  //console.log(order,isBuyer,isSeller,connectedAddress);

  const { balance, loadingBalance, error } = useBalance(
    isBuyer?buyer.address:seller.address,
    token.address,
    false
  );

  const { isLoading, isSuccess, opensDispute, data } = useOpenDispute({
    orderID: order.id.toString(),
  });

  useTransactionFeedback({
    hash: data?.hash,
    isSuccess,
    Link: <TransactionLink hash={data?.hash} />,
    description: "Opened a dispute",
  });

//   useEffect(() => {
//   	if (isSuccess) {
//   		router.push(`/orders/${uuid}`);
//   	}
//   }, [isSuccess, uuid]);

  useEffect(() => {
    if (disputeConfirmed) {
    	onOpenDispute();
    }
  }, [disputeConfirmed]);

  const updateOrderStatus = async()=>{
    await fetch(`/api/updateOrder/?id=${order.id}`, {
			method: 'POST',
			body: JSON.stringify({status:4}),
			headers: {
				Authorization: `Bearer ${getAuthToken()}`,
				'Content-Type': 'application/json',
			}
		});
    // window.location.reload();
    router.reload();
  }

  
  const disputeFee = 5_000_000 / 1e9;
  const { data: escrowData, loadingContract } = useContractRead(
    tradeId,
    "escrow",
    true
  );
  const canOpenDispute =
  (isBuyer || isSeller) &&
  ((escrowData?.sellerCanCancelAfter ?? new BN(0)) as BN).toNumber() === 1;
	const paidForDisputeResult = escrowData?.dispute == true && (isBuyer?escrowData?.buyerPaidDispute:escrowData?.sellerPaidDispute);
  console.log('paid for dispute ',paidForDisputeResult);
	// console.log("here is your balance,",balance);



  if (balance === undefined || balance==null|| loadingContract ||paidForDisputeResult === undefined || loadingBalance) {
    return <p>Loading...</p>;
  }

  
  const onOpenDispute = () => {
    if (!isConnected || !canOpenDispute) return;

    if (!disputeConfirmed) {
      setModalOpen(true);
      return;
    }
	//console.log("Balance is ",balance);
    if (disputeFee > (balance || 0)) {
      toast.error(`You need ${disputeFee} SOL to open a dispute`, {
        theme: "dark",
        position: "top-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
      setDisputeConfirmed (false);
    } else {
      const result=opensDispute?.();
      result?.then((res)=>{
          if(updateFormDetails && res){
            // @ts-ignore
            onContinue(true);
            // setDisputeOpen(true);
          }
          if(status!=='dispute' && res){
            updateOrderStatus();
          }
        })
        .catch((err)=>{
          console.log(err);
        })
      }
  };

  return (
    <>
      <Button
        title={
          (paidForDisputeResult)
            ? "Already opened"
            : !canOpenDispute
            ? "You cannot dispute"
            : isLoading
            ? "Processing..."
            : isSuccess
            ? "Done"
            : title
        }
        processing={isLoading}
        disabled={
			disabledProp||
          isSuccess ||
          !canOpenDispute ||
          (paidForDisputeResult.result as boolean)
        }
        onClick={onOpenDispute}
        outlined={outlined}
      />
      <Modal
        actionButtonTitle="Yes, confirm"
        title="Dispute Trade"
        content={`Once you dispute the trade the other party will have 24 hours to counter the dispute and send it to arbitration. A small fee of ${disputeFee} SOL is required to open a dispute. If you win the dispute the fee will be returned`}
        type="confirmation"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAction={() => setDisputeConfirmed(true)}
      />
    </>
  );
};

export default OpenDisputeButton;
