// components/Buy/Amount.tsx

/* eslint-disable react/jsx-curly-newline */
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import Flag from "components/Flag/Flag";
import Input from "components/Input/Input";
import { AccountInfo } from "components/Listing";
import StepLayout from "components/Listing/StepLayout";
import Token from "components/Token/Token";
import { useFormErrors, useAccount } from "hooks";
import { countries } from "models/countries";
import { Errors, Resolver } from "models/errors";
import { Bank, List, Order, User } from "models/types";
import { useRouter } from "next/router";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { truncate } from "utils";

import snakecaseKeys from "snakecase-keys";
// import { useContractRead } from 'wagmi';
// import { OpenPeerDeployer, OpenPeerEscrow } from 'abis';
import { Abi, formatUnits, parseUnits } from "viem";
// import { DEPLOYER_CONTRACTS } from 'models/networks';
import ModalWindow from "components/Modal/ModalWindow";
import BankSelect from "components/Select/BankSelect";
import { BuyStepProps, UIOrder } from "./Buy.types";
import useGaslessEscrow from "@/hooks/transactions/escrow/useGaslessEscrow";
import { useContractRead } from "@/hooks/transactions/useContractRead";
import { PublicKey } from "@solana/web3.js";
import { useBalance } from "@/hooks/transactions";
import useGaslessEscrowAccountDeploy from "@/hooks/transactions/deploy/useGaslessEscrowAccountDeploy";
import Loading from "../Loading/Loading";
import OrderPaymentMethod from './OrderPaymentMethod';

interface BuyAmountStepProps extends BuyStepProps {
  price: number | undefined;
}

const Prefix = ({
  label,
  image,
}: {
  label: string;
  image: React.ReactNode;
}) => (
  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
    <div className="flex flex-row">
      <span className="mr-2">{image}</span>
      <span className="text-gray-500">{label}</span>
    </div>
  </div>
);

const Amount = ({ order, updateOrder, price }: BuyAmountStepProps) => {
  const router = useRouter();
  const [orderID, setOrderID] = useState(null);

  const { fiatAmount: quickBuyFiat, tokenAmount: quickBuyToken } = router.query;

  const {
    list = {} as List,
    token_amount: orderTokenAmount,
    fiat_amount: orderFiatAmount,
  } = order;
  const { address } = useAccount();
  const {
    fiat_currency: currency,
    token,
    accept_only_verified: acceptOnlyVerified,
  } = list;

  const [fiatAmount, setFiatAmount] = useState<number | undefined>(
    orderFiatAmount || (quickBuyFiat ? Number(quickBuyFiat) : undefined)
  );
  const [tokenAmount, setTokenAmount] = useState<number | undefined>(
    orderTokenAmount || (quickBuyToken ? Number(quickBuyToken) : undefined)
  );
  const [user, setUser] = useState<User | null>();
  const [bank, setBank] = useState<Bank>();

  const { errors, clearErrors, validate } = useFormErrors();
  //@ts-ignore
  const banks = Array.isArray(list.payment_methods)? list.payment_methods.map((pm) => ({ ...pm.bank, id: pm.id })): [list.payment_methods].map((pm) => ({ ...pm.bank, id: pm.id }));

  const instantEscrow = list?.escrow_type === "instant";
  const { data: sellerContract } = useContractRead(
    list.type === "SellList" ? order.list.seller.address || "" : address || "",
    "escrowState",
    true
  );

  // Memoize balance hook parameters
  const balanceAddress = useMemo(() => 
    list.type === "SellList" ? sellerContract || "" : address || "",
    [list.type, sellerContract, address]
  );
  
  const balanceToken = useMemo(() => 
    token?.address || PublicKey.default.toBase58(),
    [token?.address]
  );

  const { balance: balance } = useBalance(
    balanceAddress,
    balanceToken,
    true
  );

  const { data: fee } = useContractRead(sellerContract || "", "fee", true);
  //console.log('Instant',instantEscrow);

  const resolver: Resolver = () => {
    const error: Errors = {};

    const {
      limit_min: limitMin,
      limit_max: limitMax,
      total_available_amount: totalAvailableAmount,
    } = list;
    const max = Number(limitMax) || Number(totalAvailableAmount) * (price || 0);

    if (!fiatAmount) {
      error.fiatAmount = "Should be bigger than 0";
    } else if (fiatAmount < (Number(limitMin) || 0)) {
      error.fiatAmount = `Should be more or equal ${limitMin}`;
    } else if (fiatAmount > max) {
      error.fiatAmount = `Should be less or equal ${max}`;
    }

    if (!tokenAmount) {
      error.tokenAmount = "Should be bigger than 0";
    } else {
      const escrowFee = fee || BigInt(0);

      const escrowedBalance =
        BigInt(
          Math.floor(
            parseFloat(balance?.toString() ?? "0.0") * 10 ** token.decimals
          )
        ) - escrowFee;
      if (
        instantEscrow &&
        escrowedBalance < parseUnits(String(tokenAmount), token.decimals)
      ) {
        error.tokenAmount = `Only ${formatUnits(
          escrowedBalance,
          token.decimals
        )} ${
          token.symbol
        } is available in the escrow contract. Should be less or equal ${formatUnits(
          escrowedBalance,
          token.decimals
        )} ${token.symbol}.`;
      }
    }

    if (list.type === "SellList" && !bank?.id) {
      error.bankId = "Should be present";
    }

    return error;
  };

  let seller = list.type === "SellList" ? list.seller.address : address;
  let buyer = list.type === "SellList" ? address : list.seller.address;
  let time = Number(order.list.payment_time_limit) * 60;
  let tokenAddress = order.list.token.address;
  let tokenDecimal = order.list.token.decimals;
  const { isFetching, isLoading, isSuccess, data, deploy } =
  useGaslessEscrowAccountDeploy({
    orderId: orderID || "",
    seller: seller || "",
    buyer: buyer || "",
    amount: tokenAmount || 0,
    time: time,
    tokenAddress: tokenAddress,
    tokenDecimal: tokenDecimal,
    instantEscrow,
    isLocalSigningRequired: buyer==address,
    fromWallet:!instantEscrow
  });
  useEffect(() => {
    if (orderID && !isLoading && instantEscrow) {
     // console.log('Here in Amount', buyer==address, instantEscrow);
      deploy?.();
    }
  }, [orderID]);

  useEffect(() => {
    if (isSuccess && data) {
      updateTrade();
    }
  }, [isSuccess, data, orderID, router]);
  const updateTrade = async () => {
		const result = await fetch(`/api/updateOrder/?id=${orderID}`, {
			method: 'POST',
			body: JSON.stringify({status:1}),
			headers: {
				Authorization: `Bearer ${getAuthToken()}`,
				'Content-Type': 'application/json',
			}
		});
    if(result.status==200) {
      router.push(`/orders/${orderID}`);
    }
    };
  const createOrder = async (newOrder: Order) => {
    if (!newOrder.payment_method?.bank?.id) {
        console.error('No payment method selected');
        return;
    }

    // Format the request payload according to API expectations
    const orderPayload = {
        list_id: newOrder.list.id,
        buyer_id: address, // Add the missing buyer_id
        fiat_amount: newOrder.fiat_amount,
        token_amount: truncate(newOrder.token_amount, token.decimals),
        price: newOrder.price,
        payment_method: {
            id: newOrder.payment_method.id,
            bank: {
                id: newOrder.payment_method.bank.id
            },
            bank_id: newOrder.payment_method.bank_id,
            values: newOrder.payment_method.values || {}
        }
    };

    try {
        const result = await fetch("/api/createOrder/", {
            method: "POST",
            body: JSON.stringify(orderPayload),
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
                "Content-Type": "application/json",
            },
        });

        if (!result.ok) {
            const errorData = await result.json();
            throw new Error(errorData.error || 'Failed to create order');
        }

        const { data } = await result.json();
   
        if (data.id) {
            let orderId = data.id;
            if (!seller || !buyer || !instantEscrow) {
                router.push(`/orders/${orderId}`);
                return;
            } else {
                setOrderID(orderId);
            }
        }
    } catch (error) {
        console.error('Order creation error:', error);
        // Handle error appropriately
        throw error;
    }
  };

  const onProceed = async () => {
    console.log('Amount.tsx - onProceed');
    console.log('Current state:', { list, price, fiatAmount, tokenAmount, payment_method: order.payment_method });

    if (!order?.payment_method?.bank?.id) {
      console.error('No payment method selected');
      // TODO: Show error to user
      return;
    }

    if (acceptOnlyVerified && user && !user.verified) {
      console.log('Verification required - redirecting');
      router.push(`/${user.address}`);
      return;
    }

    if (list && price) {
      if (!validate(resolver)) {
        console.log('Validation failed');
        return;
      }
      
      const newOrder: UIOrder = {
        ...order,
        fiat_amount: fiatAmount!,
        token_amount: tokenAmount!,
        price
      };

      console.log('Creating order with:', newOrder);
      await createOrder(newOrder);
    }
  };

  const [inputSource, setInputSource] = useState<'token' | 'fiat'>('token');

  function onChangeToken(val: number | undefined) {
    clearErrors(["tokenAmount"]);
    setInputSource('token');
    setTokenAmount(val);
    
    const newFiatAmount = val !== undefined && price ? Math.round((val * price) * 100) / 100 : undefined;
    setFiatAmount(newFiatAmount);

    // Update order here directly with proper type handling
    const orderUpdate = {
      ...order
    };
    if (val !== undefined) {
      orderUpdate.token_amount = val;
      orderUpdate.fiat_amount = newFiatAmount ?? 0;
    }
    updateOrder(orderUpdate);
  }

  function onChangeFiat(val: number | undefined) {
    clearErrors(["fiatAmount"]);
    setInputSource('fiat');
    setFiatAmount(val);
    
    if (price && val !== undefined && inputSource === 'fiat') {
      const newTokenAmount = val / price;
      setTokenAmount(newTokenAmount);
      
      // Update order here directly with proper type handling
      updateOrder({
        ...order,
        fiat_amount: val,
        token_amount: newTokenAmount
      });
    } else {
      setTokenAmount(undefined);
      updateOrder({
        ...order,
        fiat_amount: 0,
        token_amount: 0
      });
    }
  }

  useEffect(() => {
    if (!address) return;
    
    fetch(`/api/user_profiles/${address}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })
      .then((res) => res.json())
      .then((res) => res.data)
      .then((data) => {
        if (data.errors) {
          setUser(null);
        } else {
          setUser(data);
          // updateUserState(data);
        }
      });
  }, [address]);

  useEffect(() => {
    if (list.type === "SellList" && banks.length > 0 && !bank) {
      setBank(banks[0]);
    }
  }, [banks]);

  const handlePaymentMethodUpdate = useCallback((newOrder: UIOrder) => {
    console.log('Payment method update:', newOrder);
    updateOrder(newOrder);
  }, [updateOrder]);

  if (!user?.email) {
    return <AccountInfo setUser={setUser} />;
  }
  if(isLoading){
    return <Loading/>;
  }

  const buyCrypto = list.type === "BuyList";
  const verificationRequired = acceptOnlyVerified && !user?.verified;
  const buttonText = verificationRequired ? "Verify" : "";

  return (
    <StepLayout 
      onProceed={onProceed} 
      buttonText={list.escrow_type === 'instant' ? 'Continue' : 'Sign and Continue'}
    >
      <div className="space-y-8">
        <div className="my-8">
          {verificationRequired ? (
            <ModalWindow
              title="ID Verification Needed"
              content={
                <div className="py-4">
                  You&apos;re almost set. Please, take a moment to verify some
                  information before continue, we use Quadrata a secure service.
                </div>
              }
              type="confirmation"
              actionButtonTitle="Verify ID"
              open
              onClose={() => router.back()}
              onAction={() => router.push(`/${address}`)}
              closeAfterAction={false}
            />
          ) : (
            <>
              <Input
                label={buyCrypto ? "Amount to sell" : "Amount to buy"}
                prefix={
                  <Prefix
                    label={token!.name}
                    image={<Token token={token} size={24} />}
                  />
                }
                id="amountToReceive"
                value={tokenAmount}
                onChangeNumber={(t) => onChangeToken(t)}
                type="decimal"
                decimalScale={18}
                error={errors.tokenAmount}
              />
              <Input
                label={buyCrypto ? "Amount you'll receive" : "Amount you'll pay"}
                prefix={
                  <Prefix
                    label={currency!.symbol}
                    image={
                      <Flag name={countries[currency.country_code]} size={24} />
                    }
                  />
                }
                id="amountBuy"
                value={fiatAmount}
                onChangeNumber={(f) => onChangeFiat(f)}
                type="decimal"
                decimalScale={18}
                error={errors.fiatAmount}
              />
            </>
          )}
        </div>

        {!verificationRequired && (
          <div className="mt-8">
            <OrderPaymentMethod 
              order={order} 
              updateOrder={handlePaymentMethodUpdate}
            />
          </div>
        )}
      </div>
    </StepLayout>
  );
};

export default Amount;
