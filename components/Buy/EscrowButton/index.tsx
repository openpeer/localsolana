import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { useAccount } from "hooks";
import React, { useState } from "react";
import { EscrowFundsParams } from "./EscrowButton.types";
import EscrowFundsButton from "./EscrowFundsButton";
import { PublicKey } from "@solana/web3.js";
import { useContractRead } from "@/hooks/transactions/useContractRead";
import CreateEscrowAccount from "./CreateEscrowAccount";

const EscrowButton = ({
  token,
  tokenAmount,
  buyer,
  seller,
  uuid,
  instantEscrow,
  sellerWaitingTime,
  tradeID,
  fromWallet
}: EscrowFundsParams) => {
  const nativeToken = token.address === PublicKey.default.toBase58();
  const [approved, setApproved] = useState(instantEscrow);
  const { address } = useAccount();

  const { data: sellerContract } = useContractRead(tradeID, "escrow", true);
  const { data: fee, loading } = useContractRead(tradeID, "fee", true);

  if (loading || fee === undefined) return <></>;

  const needsToDeploy = !instantEscrow || !sellerContract;

  return (
    <span className="w-full">
      {!needsToDeploy && !instantEscrow ? (
        <EscrowFundsButton
          buyer={buyer}
          fee={fee}
          token={token}
          tokenAmount={tokenAmount}
          uuid={uuid}
          contract={""}
          seller={seller}
          tradeID={tradeID}
          instantEscrow={instantEscrow}
          sellerWaitingTime={sellerWaitingTime}
          fromWallet={fromWallet}
        />
      ) : (
        needsToDeploy && (
          <CreateEscrowAccount
            buyer={buyer}
            token={token}
            amount={tokenAmount}
            orderId={uuid}
            time={sellerWaitingTime}
            seller={seller}
            instantEscrow={instantEscrow}
            fromWallet={fromWallet}
          />
        )
      )}
    </span>
  );
};

export default EscrowButton;
