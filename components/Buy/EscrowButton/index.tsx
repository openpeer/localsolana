//import { OpenPeerDeployer } from 'abis';
//import { constants } from 'ethers';
import { useAccount, useUserProfile } from "hooks";
//import { DEPLOYER_CONTRACTS } from 'models/networks';
import React, { useState } from "react";
//import { useContractRead, useNetwork } from 'wagmi';

import ApproveTokenButton from "./ApproveTokenButton";
import DeploySellerContract from "./DeploySellerContract";
import { EscrowFundsParams } from "./EscrowButton.types";
import EscrowFundsButton from "./EscrowFundsButton";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useContractRead } from "@/hooks/transactions/useContractRead";
import useEscrowFee from "@/hooks/useEscrowFee";
import { User } from "@/models/types";
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
}: EscrowFundsParams) => {
  const nativeToken = token.address === PublicKey.default.toBase58();
  const [approved, setApproved] = useState(instantEscrow);
  const { address } = useAccount();

  const { data: sellerContract } = useContractRead(tradeID, "escrow", true);
  const { data: fee, loadingContract } = useContractRead(tradeID, "fee", true);

  const totalAmount = (tokenAmount + fee) * 10 ** token.decimals;

  if (loadingContract || fee === undefined) return <></>;

  const needsToDeploy = !instantEscrow && !sellerContract;

  return (
    <span className="w-full">
      {!needsToDeploy && !instantEscrow ? (
        <EscrowFundsButton
          buyer={buyer}
          fee={fee}
          token={token}
          tokenAmount={tokenAmount}
          uuid={uuid}
          contract={"asd"}
          seller={seller}
          tradeID={tradeID}
          instantEscrow={instantEscrow}
          sellerWaitingTime={sellerWaitingTime}
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
          />
        )
      )}
      {/* {!instantEscrow && !nativeToken && (
        <div
          className={nativeToken || approved || needsToDeploy ? "hidden" : ""}
        >
          <ApproveTokenButton
            token={token}
            amount={totalAmount!}
            spender={seller}
            onApprovalChange={setApproved}
          />
        </div>
      )} */}
    </span>
  );
};

export default EscrowButton;
function setUser(user: User): void {}
