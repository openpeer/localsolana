import useResolveDispute from "@/hooks/transactions/useResolveDispute";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { Button, Modal } from "components";
import {
  useCancelReasons,
  useConfirmationSignMessage,
  useAccount,
  useTransactionFeedback,
} from "hooks";
import { Order } from "models/types";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import TransactionLink from "./TransactionLink";
import { list } from "postcss";

interface ResolveDisputeButtonParams {
  order: Order;
  outlined?: boolean;
  title?: string;
  user_address?: string;
}

const ResolveDisputeButton = ({
  order,
  outlined = true,
  title = "Resolve Dispute",
  user_address,
}: ResolveDisputeButtonParams) => {
  const { seller, buyer, uuid, status, id } = order;

  const { address } = useAccount();
  const { cancellation, otherReason, setOtherReason, toggleCancellation } =
    useCancelReasons();

  const isBuyer = buyer.address === user_address;
  const isSeller = seller.address === user_address;

  let user_name = "No user available";

  if (isBuyer) {
    user_name = buyer.name
      ? `(${buyer.name})`
      : "Buyer doesn't include name yet.";
  } else if (isSeller) {
    user_name = seller.name
      ? `(${seller.name})`
      : "Seller doesn't include name yet.";
  }
  user_name += ` ${user_address}`;

  const [modalOpen, setModalOpen] = useState(false);
  const [resolutionConfirmed, setResolutionConfirmed] = useState(false);
  const { isLoading, isSuccess, declareWinner, data } = useResolveDispute({
    orderID: order.id.toString(),
    buyer: buyer.address,
    seller: seller.address,
    winner: user_address || "",
    token: order.list.token.address,
  });

  const markDisputeResolved = async () => {
    const winnerId = isBuyer ? buyer.id : seller.id;
    // need to change api in favour of particular user.
    // change here
    const result = await fetch(`/api/updateDispute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        winner_id: winnerId,
        order_id: id,

        resolved: true,
      }),
    });
    const jsonData = await result.json();

    if (jsonData.status === 200) {
      if (jsonData?.data?.resolved) {
        window.location.reload();
      }
    } else {
      toast.error("Error cancelling the order", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
      });
    }
  };

  useTransactionFeedback({
    hash: data?.hash,
    isSuccess,
    Link: <TransactionLink hash={data?.hash} />,
    description: "Resolved a dispute",
  });

  const { signMessage } = useConfirmationSignMessage({
    onSuccess: async () => {
      const result = await fetch(`/api/orders/${id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          cancellation,
          other_reason:
            otherReason && otherReason !== "" ? otherReason : undefined,
        }),
      });
      const savedOrder = await result.json();
      if (savedOrder.uuid) {
        if (status !== "cancelled") {
          window.location.reload();
        }
      } else {
        toast.error("Error cancelling the order", {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          progress: undefined,
        });
      }
    },
  });


  const onResolveDispute = () => {

    if (!resolutionConfirmed) {
      setModalOpen(true);
      return;
    }

    declareWinner?.();
  };

  useEffect(() => {
    if (resolutionConfirmed) {
      onResolveDispute();
    }
  }, [resolutionConfirmed]);

  useEffect(()=>{
    if(isSuccess){
      markDisputeResolved();
    }
  },[isSuccess]);

  if (address !== process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS) return <></>;

  return (
    <>
      <Button title={title} onClick={onResolveDispute} outlined={outlined} />
      <Modal
        actionButtonTitle="Yes, confirm"
        title={`Resolve dispute in favour of ${
          isBuyer ? "Buyer" : "Seller"
        } ${user_name}`}
        content={""}
        type="alert"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAction={() => setResolutionConfirmed(true)}
      />
    </>
  );
};

export default ResolveDisputeButton;
