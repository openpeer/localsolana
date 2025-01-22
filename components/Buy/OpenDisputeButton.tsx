import { useBalance } from "@/hooks/transactions/useBalance";
import useOpenDispute from "@/hooks/transactions/useOpenDispute";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { Button, Modal } from "components";
import TransactionLink from "components/TransactionLink";
import { useTransactionFeedback, useAccount } from "hooks";
import { Order } from "models/types";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useShyft from "@/hooks/transactions/useShyft";

interface OpenDisputeButtonParams {
  order: Order;
  outlined?: boolean;
  title?: string;
  disabledProp?: boolean;
  updateFormDetails?: boolean;
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
  const [disputeConfirmed, setDisputeConfirmed] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Use Shyft for balance checks
  const { shyft, getTokenBalance, getAccountInfo } = useShyft();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canOpenDispute, setCanOpenDispute] = useState(false);
  const [paidForDispute, setPaidForDispute] = useState(false);

  // Fetch balance and account info using Shyft
  useEffect(() => {
    const fetchData = async () => {
      if (!shyft || !connectedAddress) return;

      try {
        setLoadingBalance(true);
        const address = isBuyer ? buyer.address : seller.address;
        
        // Get SOL balance for dispute fee
        const bal = await getTokenBalance(address, token.address);
        setBalance(bal);

        // Get account info to check if dispute is possible
        const accountInfo = await getAccountInfo(tradeId);
        if (accountInfo) {
          setCanOpenDispute(true); // You can add more specific checks here based on account data
          setPaidForDispute(false); // You can add more specific checks here based on account data
        }
        
        setError(null);
      } catch (err) {
        console.error("[OpenDisputeButton] Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Error fetching data");
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchData();
  }, [shyft, isBuyer, buyer.address, seller.address, token.address, tradeId, connectedAddress]);

  const { isLoading, isSuccess, opensDispute, data } = useOpenDispute({
    orderID: order.id.toString(),
  });

  useTransactionFeedback({
    hash: data?.hash,
    isSuccess,
    Link: <TransactionLink hash={data?.hash} />,
    description: "Opened a dispute",
  });

  useEffect(() => {
    if (disputeConfirmed) {
      onOpenDispute();
    }
  }, [disputeConfirmed]);

  const updateOrderStatus = async () => {
    try {
      setIsUpdatingStatus(true);
      const result = await fetch(`/api/updateOrder?id=${order.id}`, {
        method: 'POST',
        body: JSON.stringify({ status: 4 }),
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!result.ok) {
        throw new Error('Failed to update order status');
      }
      
      router.reload();
    } catch (err) {
      console.error("[OpenDisputeButton] Error updating order status:", err);
      toast.error("Failed to update order status", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const disputeFee = 5_000_000 / 1e9;

  // Show loading state
  if (!shyft || (loadingBalance && balance === null)) {
    return (
      <button
        className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed"
        disabled
      >
        Loading...
      </button>
    );
  }

  // Show error state
  if (error) {
    console.error("[OpenDisputeButton] Error loading data:", error);
    return (
      <button
        className="px-4 py-2 bg-red-400 text-white rounded-md cursor-not-allowed"
        disabled
      >
        Error loading data
      </button>
    );
  }

  const onOpenDispute = async () => {
    if (!isConnected || !canOpenDispute) return;

    if (!disputeConfirmed) {
      setModalOpen(true);
      return;
    }

    if (disputeFee > (balance || 0)) {
      toast.error(`You need ${disputeFee} SOL to open a dispute`, {
        theme: "dark",
        position: "top-right",
        autoClose: 10000,
      });
      setDisputeConfirmed(false);
      return;
    }

    try {
      if (!opensDispute) {
        throw new Error("Dispute function not available");
      }
      const success = await opensDispute();
      if (success) {
        if (updateFormDetails) {
          await onContinue?.(true);
        }
        if (status !== 'dispute') {
          await updateOrderStatus();
        }
      }
    } catch (err) {
      console.error("[OpenDisputeButton] Error opening dispute:", err);
      toast.error("Failed to open dispute", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  return (
    <>
      <Button
        title={
          paidForDispute
            ? "Already opened"
            : !canOpenDispute
            ? "You cannot dispute"
            : isLoading || isUpdatingStatus
            ? "Processing..."
            : isSuccess
            ? "Done"
            : title
        }
        processing={isLoading || isUpdatingStatus}
        disabled={
          disabledProp ||
          isSuccess ||
          !canOpenDispute ||
          paidForDispute
        }
        onClick={onOpenDispute}
        outlined={outlined}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Open Dispute"
        content={`Once you dispute the trade the other party will have 24 hours to counter the dispute and send it to arbitration. A small fee of ${disputeFee} SOL is required to open a dispute. If you win the dispute the fee will be returned`}
        type="confirmation"
        actionButtonTitle="Yes, confirm"
        onAction={() => {
          setModalOpen(false);
          setDisputeConfirmed(true);
        }}
      />
    </>
  );
};

export default OpenDisputeButton;
