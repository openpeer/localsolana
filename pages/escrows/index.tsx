// import { OpenPeerDeployer, OpenPeerEscrow } from 'abis';
import {
  Accordion,
  Button,
  EscrowDepositWithdraw,
  Loading,
  Token as TokenImage,
} from "components";
import DeploySellerContract from "components/Buy/EscrowButton/DeploySellerContract";
import HeaderH3 from "components/SectionHeading/h2";
// import NetworkSelect from 'components/Select/NetworkSelect';
import { useAccount, useUserProfile } from "hooks";
// import { DEPLOYER_CONTRACTS, allChains } from 'models/networks';
import React, { useEffect, useState } from "react";
import { formatUnits } from "viem";
// import { Chain, useContractRead, useNetwork, useSwitchNetwork } from 'wagmi';
import { Contract, Token } from "models/types";
import { NEXT_PUBLIC_SOLANA_NETWORK, smallWalletAddress } from "utils";
import { useBalance, useShyft } from "@/hooks/transactions";
import { token } from "@coral-xyz/anchor/dist/cjs/utils";
import { useContractRead } from "@/hooks/transactions/useContractRead";
import { minkeApi } from "../api/utils/utils";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { headers } from "next/headers";
import { useAllTokenBalance } from "@/hooks/transactions/useAllTokenBalance";
import { TokenBalance } from "@shyft-to/js";
import { Router, useRouter } from "next/router";
import { PublicKey } from "@solana/web3.js";

const ContractTable = ({
  contract,
  tokens,
  balances,
  nativeBalance,
  needToDeploy,
  onSelectToken,
}: {
  contract: string;
  tokens: Token[];
  balances: TokenBalance[] | null;
  nativeBalance:number;
  needToDeploy: boolean;
  onSelectToken: (
    token: Token,
    contract: string,
    action: "Withdraw" | "Deposit"
  ) => void;
}) => (
  <div className="mt-4" key={contract}>
    {
      <div className="flex flex-col md:flex-row md:items-center md:space-x-1 break-all">
        <a
          href={`https://explorer.solana.com/address/${contract}?cluster=${CURRENT_NETWORK}`}
          className="text-purple-900"
          target="_blank"
          rel="noreferrer"
        >
          <h1>{contract} </h1>
        </a>
      </div>
    }
    <table className="w-full md:rounded-lg overflow-hidden mt-2">
      <thead className="bg-gray-100">
        <tr className="w-full relative">
          <th
            scope="col"
            className="hidden py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:table-cell"
          >
            Token
          </th>
          <th
            scope="col"
            className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
          >
            Balance
          </th>
          <th
            scope="col"
            className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
          >
            Action
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {tokens
          //.filter((t) => t.chain_id === chain?.id)
          .map((t) => (
            <TokenRow
              key={t.id}
              token={t}
              contract={contract}
              balance={(t.address==PublicKey.default.toBase58())?nativeBalance:(balances?.find((balance)=> balance.address == t.address)?.balance)||0}
              depositDisabled={needToDeploy}
              onSelectToken={onSelectToken}
            />
          ))}
      </tbody>
    </table>
  </div>
);

const TokenRow = ({
  token,
  contract,
  depositDisabled,
  balance,
  onSelectToken,
}: {
  token: Token;
  contract: string;
  depositDisabled: boolean;
  balance:number | null
  onSelectToken: (
    token: Token,
    contract: string,
    action: "Withdraw" | "Deposit"
  ) => void;
}) => {


  return (
    <tr className="hover:bg-gray-50">
      <div className="mt-2 flex flex-col text-gray-500 lg:hidden">
        <div className="fw-full lex flex-col space-y-4">
          <div className="flex flex-row items-center space-x-1">
            <TokenImage size={24} token={token} />

            <span className="text-sm">{token.symbol}</span>
            <span className="text-sm">{balance} {token.symbol}</span>
          </div>
          <span className="w-full flex flex-row space-x-4 pb-4">
            <Button
              title="Deposit"
              disabled={depositDisabled}
              onClick={() => onSelectToken(token, contract, "Deposit")}
            />
            <Button
              title="Withdraw"
              disabled={!balance || balance <= 0}
              onClick={() => onSelectToken(token, contract, "Withdraw")}
            />
          </span>
        </div>
      </div>
      <td className="hidden px-3.5 py-3.5 text-sm text-gray-500 lg:table-cell">
        <div className="flex flex-row items-center space-x-1">
          <TokenImage size={24} token={token} />
          <span>{token.symbol}</span>
        </div>
      </td>
      <td className="hidden px-3.5 py-3.5 text-sm text-gray-500 lg:table-cell">
        {balance ==null ? "" : `${balance}  ${token.symbol}`}
      </td>
      <td className="hidden px-3.5 py-3.5 text-sm text-gray-500 lg:table-cell">
        <div className="w-full flex flex-row space-x-4">
          <Button
            title="Deposit"
            disabled={depositDisabled}
            onClick={() => onSelectToken(token, contract, "Deposit")}
          />
          <Button
            title="Withdraw"
            disabled={!balance || balance <= 0}
            onClick={() => onSelectToken(token, contract, "Withdraw")}
          />
        </div>
      </td>
    </tr>
  );
};

const MyEscrows = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const { user, fetchUserProfile } = useUserProfile({});
  const [lastVersion, setLastVersion] = useState(0);
  const [tokens, setTokens] = useState<Token[]>([]);

  // deposit withdraw params
  const [action, setAction] = useState<"Deposit" | "Withdraw">("Deposit");
  const [token, setToken] = useState<Token>();
  const [contract, setContract] = useState<string>();

  const { data: escrowData, loadingContract } = useContractRead(
    address || "",
    "escrowState",
    true
  );

  useEffect(() => {
    setLoading(true);
    const fetchTokens = async () => {
      // change it later

      minkeApi
        .get(`/api/admin/tokens`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        })
        .then((res) => {
         console.log('Tokens are', res.data.data);
          setTokens(res.data.data);
          setLoading(false);
        });
    };

    fetchTokens();
  }, []);


   const {balances,loadingBalance,error} = useAllTokenBalance(user?.contract_address || '',false);
   const {balance} = useBalance(user?.contract_address || '',PublicKey.default.toBase58(),false);

  const needToDeploy = escrowData == null;
  const onSelectToken = (t: Token, c: string, a: "Withdraw" | "Deposit") => {
    setToken(t);
    setAction(a);
    setContract(c);
  };

  const onBack = () => {
    setToken(undefined);
    setContract(undefined);
    setAction("Deposit");
    //router.reload();
  };

  // if(loadingBalance){
  //   return (<Loading/>);
  // }

  if (action && token && (contract || escrowData)) {
    return (
      <EscrowDepositWithdraw
        action={action}
        token={token}
        contract={contract || user?.contract_address || ''}
        onBack={onBack}
        canDeposit={!needToDeploy} //ontract === contractInUse &&
        canWithdraw={!needToDeploy}
      />
    );
  }

  return (
    <div className="px-6 w-full flex flex-col items-center justify-center mt-4 pt-4 md:pt-6 text-gray-700">
      <div className="w-full lg:w-1/2 flex flex-col mb-16">
        <HeaderH3 title="Deposit or Withdraw funds" />
        <div className="border border-slate-300 mt-4 rounded">
          <div>
            {needToDeploy && (
              <div className="mt-4 mb-4 px-4">
                <DeploySellerContract
                  label="Create LocalSolana Account"
                  setContractAddress={function (
                    address: string | undefined
                  ): void {
                    throw new Error("Function not implemented.");
                  }}
                />
              </div>
            )}
          </div>
          {!!user && !loading && !needToDeploy&& (
            <>
              {
                <div className="px-4 pb-4">
                  <ContractTable
                    contract={user?.contract_address ||''}
                    tokens={tokens}
                    balances={balances||[]}
                    nativeBalance = {balance ||0}
                    needToDeploy={needToDeploy}
                    onSelectToken={onSelectToken}
                  />
                </div>
              }
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  return {
    props: { title: "My LocalSolana Account" },
  };
}

export default MyEscrows;
