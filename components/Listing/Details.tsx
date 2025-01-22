import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { useConfirmationSignMessage, useAccount, useUserProfile } from "hooks";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import snakecaseKeys from "snakecase-keys";

import { FiatCurrency, Token, User } from "models/types";
import Checkbox from "components/Checkbox/Checkbox";
import dynamic from "next/dynamic";
import Label from "../Label/Label";
import { ListStepProps, BankPaymentMethod, DirectPaymentMethod } from "./Listing.types";
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
import { minkeApi } from '@/pages/api/utils/utils';



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
  const { data: sellerContract, error: contractError } = useContractRead(
    address || "",
    "escrowState",
    true
  );

  const { balance: balance, error: balanceError } = useBalance(
    typeof sellerContract === 'string' ? sellerContract : sellerContract?.seller || "",
    token?.address || PublicKey.default.toBase58(),
    true
  );

  const contracts = (user?.contract_address);
  const router = useRouter();

  const needToDeploy = !sellerContract;
  var   needToFund =
    (balance ?? 0) == 0 ||
    (balance || 0) < (list.totalAvailableAmount || 0);

  // Add debug logging
  // console.log('Details.tsx - Debug State:', {
  //   needToDeploy,
  //   balance,
  //   contractError,
  //   user,
  //   address,
  //   isAuthenticated,
  //   sellerContract,
  //   balanceError,
  //   type: list.type
  // });

  const needToDeployOrFund =
    escrowType === "instant"&&(needToDeploy || needToFund);

  const { signMessage } = useConfirmationSignMessage({
    onSuccess: async (data) => {
      createList();
    },
  });

  const onTermsChange = (value: string) => {
    updateList({ ...list, ...{ terms: value } });
  };

  const onProceed = () => {
    if (!needToDeployOrFund) {
      const message = listToMessage(list);
      //signMessage({ message });
      createList();
    }
  };

  const createList = async () => {
    try {
        console.log("Details.tsx - Creating list");
        console.log("Details.tsx - Full list data:", list);
        
        const escrowVal = type === 'BuyList' ? 0 : (escrowType === "manual" ? 0 : 1);
        
        if (isAuthenticated) {
            // Format data for API
            const formattedData = {
                id: list.id,
                type: list.type,
                status: list.status,
                seller_id: user?.id,
                token_id: Number(list.tokenId),
                fiat_currency_id: Number(list.fiatCurrencyId),
                margin_type: list.marginType === "fixed" ? 0 : 1,
                margin: list.marginType === "fixed" ? 0 : list.margin,
                total_available_amount: Number(list.totalAvailableAmount),
                limit_min: list.limitMin === undefined || list.limitMin === null || String(list.limitMin).trim() === '' 
                    ? null 
                    : Number(list.limitMin),
                limit_max: list.limitMax === undefined || list.limitMax === null || String(list.limitMax).trim() === '' 
                    ? null 
                    : Number(list.limitMax),
                deposit_time_limit: list.depositTimeLimit,
                payment_time_limit: list.paymentTimeLimit,
                terms: list.terms,
                chain_id: list.chainId,
                accept_only_verified: list.acceptOnlyVerified,
                escrow_type: escrowVal,
                price_source: priceSourceToNumber[list.priceSource as string],
                price: list.marginType === "fixed" ? list.margin : null,
                automatic_approval: true,
                payment_methods: list.paymentMethods?.map(pm => 
                    type === 'BuyList' ? {
                        bank_id: pm.id
                    } : {
                        bank_id: pm.id,
                        values: pm.values || {}
                    }
                ) || []
            };

            console.log("Final data being sent to API:", formattedData);

            // Choose endpoint based on whether this is a new list or update
            const endpoint = list.id ? 
                `/api/list_management/${list.id}` : 
                '/api/createList';
                
            const method = list.id ? 'PUT' : 'POST';

            const result = await minkeApi.request({
                url: endpoint,
                method: method,
                data: formattedData,
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (result.status === 200) {
                console.log("Operation successful");
                router.push('/ads');
            } else {
                console.error("Operation failed:", result);
            }
        }
    } catch (error) {
        console.error("Details.tsx - Create/Update list error:", error);
        throw error;
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

  useEffect(() => {
    if (contractError && !contractError.toString().includes("Unable to find LocalSolana account")) {
      console.error('Contract read error:', contractError);
    }
    if (balanceError) {
      console.error('Balance read error:', balanceError);
    }
  }, [contractError, balanceError]);

  if (
    (type === 'SellList' && !needToDeploy && balance == null && !contractError) || 
    user === undefined
  ) {
    console.log('Details.tsx - Returning Loading due to:', {
      isSellList: type === 'SellList',
      condition1: type === 'SellList' && !needToDeploy && balance == null && !contractError,
      condition2: user === undefined,
      needToDeploy,
      balance,
      contractError,
      user
    });
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
