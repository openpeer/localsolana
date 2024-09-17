import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { useConfirmationSignMessage, useAccount, useUserProfile } from "hooks";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import snakecaseKeys from "snakecase-keys";

import { Token } from "models/types";
import Checkbox from "components/Checkbox/Checkbox";
import dynamic from "next/dynamic";
import Label from "../Label/Label";
import Selector from "../Selector";
import { ListStepProps } from "./Listing.types";
import StepLayout from "./StepLayout";
import FundEscrow from "./FundEscrow";
import "react-quill/dist/quill.snow.css";
import Button from "../Button/Button";
import { listToMessage } from "@/utils";
import { parseUnits } from "viem";
import { useShyft } from "@/hooks/transactions";
import { PublicKey } from "@solana/web3.js";

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
  const { contract_address } = useUserProfile({});
  const {getTokenBalance,getWalletBalance} = useShyft();
  
  const router = useRouter();

  // @ts-ignore
  const createList = async (data) => {
    const escrowVal = escrowType === "manual" ? 0 : 1;
    
    if (isAuthenticated) {
      // need to add data inside the body
      const result = await fetch(
        list.id ? `/api/lists/${list.id}` : "/api/createList",
        {
          method: list.id ? "PUT" : "POST",
          body: JSON.stringify(
            snakecaseKeys(
              {
                ...list,
                ...{ bankIds: (list.banks || []).map((b) => b.id) },
                marginType: list.marginType === "fixed" ? 0 : 1,
                seller_address: address,
                escrowType: escrowVal,
                price:list.margin,
<<<<<<< HEAD
                // bank_id:'6'
=======
                bank_id:16
>>>>>>> f6422cb2b9338f8ed949c4c31ae0a2182b0fa6d1
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
      createList(data);
    },
  });

  const onTermsChange = (value: string) => {
    updateList({ ...list, ...{ terms: value } });
  };

  const needToDeploy = contract_address==null || contract_address=='';
  const [balance, setBalance] = useState<number | null>(null);
  const needToFund = (balance??0) == 0 || (balance??0)< (list.totalAvailableAmount??0);

   (balance??0) < parseUnits(String((list.totalAvailableAmount || 0) / 4), (token as Token)!.decimals);

   const fetchBalance = useCallback(async () => {
    if (!address) return;

    try {
      let fetchedBalance;
      if ((token?.address ?? '') === PublicKey.default.toBase58()) {
        fetchedBalance = await getWalletBalance(address);
        console.log("SOL Balance:", fetchedBalance);
        setBalance(fetchedBalance ?? null);
      } else {
        fetchedBalance = await getTokenBalance(address, token?.address ?? '');
        console.log("Token Balance:", fetchedBalance);
        setBalance(fetchedBalance?.balance ?? null);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, [address, token, getWalletBalance, getTokenBalance]);

  // Only run the effect once or when address or token changes
  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address, fetchBalance]);




  const needToDeployOrFund =
    escrowType === "instant" && (needToDeploy || needToFund);

  const onProceed = () => {
    if (!needToDeployOrFund) {
      createList('0x2ad3022365874e29e4220612c546499dedae4f9e826d6cb78aa0a7ed19f562903d87f0758a147c2aa43fac12c88ce07c2afa993ad68792c4026c5b64de50d3381c');
      return;
      const message = listToMessage(list);
      signMessage({ message });
    }
  };

  if (needToDeployOrFund) {
    return (
      <>
        {/* <Button title="Click Me" onClick={()=>createList('0x2ad3022365874e29e4220612c546499dedae4f9e826d6cb78aa0a7ed19f562903d87f0758a147c2aa43fac12c88ce07c2afa993ad68792c4026c5b64de50d3381c')}/> */}
        <FundEscrow
          token={token as Token}
          sellerContract={contract_address}
          chainId={chainId}
          balance={balance??0 }
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
          ? "Sign and Finish"
          : needToDeploy
          ? "Deploy Escrow Contract"
          : "Deposit in the Escrow Contract"
      }
    >
      <div className="my-8">
        {list.escrowType === "manual" && (
          <>
            <Label title="Deposit Time Limit" />
            <div className="mb-4">
              <span className="text-sm text-gray-600">
                {depositTimeLimit > 0 ? (
                  <div>
                    Your order will be cancelled if{" "}
                    {type === "SellList" ? "you" : "the seller"} dont deposit
                    after {depositTimeLimit}{" "}
                    {depositTimeLimit === 1 ? "minute" : "minutes"}.{" "}
                    <strong>
                      You can set this to 0 to disable this feature.
                    </strong>
                  </div>
                ) : (
                  <div>
                    Your orders will not be cancelled automatically.{" "}
                    <strong>
                      You can set this to 0 to disable this feature.
                    </strong>
                  </div>
                )}
              </span>
            </div>
            <Selector
              value={depositTimeLimit}
              suffix={depositTimeLimit === 1 ? " min" : " mins"}
              changeableAmount={1}
              updateValue={(n) =>
                updateList({ ...list, ...{ depositTimeLimit: n } })
              }
              decimals={0}
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
                {paymentTimeLimit}{" "}
                {paymentTimeLimit === 1 ? "minute" : "minutes"}.{" "}
                <strong>Minimum 15 minutes. Maximum 24 hours.</strong>
              </div>
            ) : (
              <div>Your orders will not be cancelled automatically. </div>
            )}
          </span>
        </div>
        <Selector
          value={paymentTimeLimit}
          suffix={paymentTimeLimit === 1 ? " min" : " mins"}
          changeableAmount={1}
          updateValue={(n) =>
            updateList({ ...list, ...{ paymentTimeLimit: n } })
          }
          decimals={0}
          minValue={15}
          maxValue={24 * 60}
        />

        <div className="mb-4">
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
        </div>
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
