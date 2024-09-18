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
import { PublicKey } from "@solana/web3.js";
import { useContractRead } from "@/hooks/transactions/useContractRead";
import useEscrowFee from "@/hooks/useEscrowFee";
import { User } from "@/models/types";

const EscrowButton = ({
  token,
  tokenAmount,
  buyer,
  seller,
  uuid,
  instantEscrow,
  sellerWaitingTime,
}: EscrowFundsParams) => {
  const nativeToken = token.address === PublicKey.default.toBase58();
  const [approved, setApproved] = useState(nativeToken || instantEscrow);
  //const { chain } = useNetwork();
  //const deployer = chain ? DEPLOYER_CONTRACTS[chain.id] : undefined;
  const { address } = useAccount();

  // const { data: sellerContract } = useContractRead({
  // 	functionName: 'sellerContracts',
  // 	args: [instantEscrow ? seller : address],
  // 	enabled: !!address,
  // 	watch: true
  // });

  // const { isFetching, fee, totalAmount } = useEscrowFee({
  // 	address: sellerContract as string | undefined,
  // 	token,
  // 	tokenAmount,
  // });
  const isFetching = false;
  const fee = 10;
  const totalAmount = tokenAmount + fee;
  if (isFetching || fee === undefined) return <>adasasda</>;
  const { user } = useUserProfile({
	onUpdateProfile: setUser
});
  const needsToDeploy = !instantEscrow && (user?.contract_address);
console.log('instantEscrow',instantEscrow);
  return (
    <span className="w-full">
      {(nativeToken || approved) && !needsToDeploy ? (
        <EscrowFundsButton
          buyer={buyer}
          fee={fee}
          token={token}
          tokenAmount={tokenAmount}
          uuid={uuid}
          contract={"asd"}
          seller={seller}
          instantEscrow={instantEscrow}
          sellerWaitingTime={sellerWaitingTime}
        />
      ) : (
        needsToDeploy && <DeploySellerContract />
      )}
      {!instantEscrow && !nativeToken && (
        <div
          className={nativeToken || approved || needsToDeploy ? "hidden" : ""}
        >
          <ApproveTokenButton
            token={token}
            amount={totalAmount!}
            spender={'asdas'}
            onApprovalChange={setApproved}
          />
        </div>
      )}
    </span>
  );
};

export default EscrowButton;
function setUser(user: User): void {
}