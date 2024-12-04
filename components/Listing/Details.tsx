import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { useConfirmationSignMessage, useAccount, useUserProfile } from "hooks";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import snakecaseKeys from "snakecase-keys";

import { FiatCurrency, Token, User } from "models/types";
import Checkbox from "components/Checkbox/Checkbox";
import dynamic from "next/dynamic";
import Label from "../Label/Label";
import { ListStepProps } from "./Listing.types";
import StepLayout from "./StepLayout";
import FundEscrow from "./FundEscrow";
import "react-quill/dist/quill.snow.css";
import { listToMessage } from "@/utils";
import { useBalance } from "@/hooks/transactions";
import { PublicKey } from "@solana/web3.js";
import Loading from "../Loading/Loading";
import { useContractRead } from "@/hooks/transactions/useContractRead";
import { watch } from "fs";
import FriendlySelector from 'components/FriendlySelector';
import FriendlyTime from 'components/FriendlyTime';
import { priceSourceToNumber } from 'constants/priceSourceMap';


const QuillEditor = dynamic(() => import("react-quill"), { ssr: false });

const Details = ({ list, updateList }: ListStepProps) => {
  const {
    terms,
    depositTimeLimit,
    paymentTimeLimit,
    type,
    chainId,
    token,
    acceptOnlyVerified,
    escrowType,
  } = list;
  const { address, isAuthenticated } = useAccount();
  const { user, fetchUserProfile } = useUserProfile({});
  const { data: sellerContract } = useContractRead(
    address || "",
    "escrowState",
    true
  );

  const { balance: balance } = useBalance(
    sellerContract || "",
    token?.address || PublicKey.default.toBase58(),true
  );

  const contracts = (user?.contract_address);
  const router = useRouter();

  // @ts-ignore
  const createList = async () => {
    const escrowVal = escrowType === "manual" ? 0 : 1;

    if (isAuthenticated) {
      const result = await fetch(
        list.id ? `/api/list_management/${list.id}` : "/api/createList",
        {
          method: list.id ? "PUT" : "POST",
          body: JSON.stringify(
            snakecaseKeys(
              {
                ...list,
                ...{ bankIds: (list.id)?(list.banks||[]):(list.banks || []).map((b) => b.id) },
                marginType: list.marginType === "fixed" ? 0 : 1,
                seller_address: address,
                escrowType: escrowVal,
                price: list.marginType === "fixed" ? list.margin : null, 
                bank_id: 16,
                priceSource: priceSourceToNumber[list.priceSource as string] || 0
              },
              { deep: true }
            )
          ),
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      const apiResult = await result.json();
      if (apiResult!.data!.id) {
        router.push(`/${address}`);
      }
    }
  };

  const { signMessage } = useConfirmationSignMessage({
    onSuccess: async (data) => {
      createList();
    },
  });

  const onTermsChange = (value: string) => {
    updateList({ ...list, ...{ terms: value } });
  };


  const needToDeploy = !sellerContract
  var   needToFund =
    (balance ?? 0) == 0 ||
    (balance || 0) < (list.totalAvailableAmount || 0);


  const needToDeployOrFund =
  escrowType === "instant"&&(needToDeploy || needToFund);

  const onProceed = () => {
    if (!needToDeployOrFund) {
      const message = listToMessage(list);
      //signMessage({ message });
      createList();
    }
  };
  useEffect(() => {
		if (sellerContract) {
			const deployed = user?.contract_address;
    
			if (!deployed) {
				fetchUserProfile();
			}
		}
	}, [contracts, sellerContract]);
  if ((!needToDeploy && balance == null) || user === undefined) {
    return <Loading />;
  }

  

  if (needToDeployOrFund) {
    return (
      <>
        <Label title="Deposit Time Limit" />
        <FundEscrow
          token={token as Token}
          sellerContract={sellerContract}
          chainId={chainId}
          balance={balance || 0}
          totalAvailableAmount={list.totalAvailableAmount!}
        />
      </>
    );
  }

  return (
    <StepLayout
      onProceed={onProceed}
      buttonText={
        !needToDeployOrFund
          ? "Post Ad"
          : needToDeploy
          ? "Deploy Escrow Account"
          : "Deposit in the Escrow Account"
      }
    >
      <div className="my-8">
      {/* <button onClick={()=>createList()}>Create Ad</button> */}
        {list.escrowType === "manual" && (
          <>
            <Label title="Deposit Time Limit" />
            <div className="mb-4">
              <span className="text-sm text-gray-600">
                <div>
									Your order will be cancelled if {type === 'SellList' ? 'you' : 'the seller'} don't
									deposit after <FriendlyTime timeInMinutes={Number(depositTimeLimit)} />.{' '}
								</div>
              </span>
            </div>
            <FriendlySelector
							value={depositTimeLimit}
							updateValue={(n) => updateList({ ...list, depositTimeLimit: n })}
							error={depositTimeLimit < 15 ? 'Minimum time is 15 mins' : undefined}
						/>
          </>
        )}

        <Label title="Payment Time Limit" />
        <div className="mb-4">
          <span className="text-sm text-gray-600">
            {paymentTimeLimit > 0 ? (
              <div>
                Your order can be cancelled if{" "}
                {type === "SellList" ? "the buyer" : "you"} dont pay after{" "}
                <FriendlyTime timeInMinutes={Number(paymentTimeLimit)} />.{" "}
                <strong>Minimum 15 minutes. Maximum 72 hours.</strong>
              </div>
            ) : (
              <div>Your orders will not be cancelled automatically. </div>
            )}
          </span>
        </div>
        <FriendlySelector
					value={paymentTimeLimit}
					updateValue={(n) => updateList({ ...list, paymentTimeLimit: n })}
					error={paymentTimeLimit < 15 ? 'Minimum time is 15 mins' : undefined}
				/>

        {/* <div className="mb-4">
          <Checkbox
            content={`Accept only verified ${
              type === "SellList" ? "buyers" : "sellers"
            }`}
            id="verified"
            name="verified"
            checked={acceptOnlyVerified}
            onChange={() =>
              updateList({
                ...list,
                ...{ acceptOnlyVerified: !acceptOnlyVerified },
              })
            }
          />
        </div> */}
        <Label title="Order Terms" />
        <QuillEditor
          value={terms}
          onChange={onTermsChange}
          placeholder="Write the terms and conditions for your listing here"
        />
      </div>
    </StepLayout>
  );
};

export default Details;
