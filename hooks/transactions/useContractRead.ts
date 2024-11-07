import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import useLocalSolana from "./useLocalSolana";
import { BN } from "@coral-xyz/anchor";
import useAccount from "../useAccount";
import useShyft from "./useShyft";

export const useContractRead = (contractAddress: string, method: string,watch? : boolean) => {
  const [data, setData] = useState<any>(null);
  const [loadingContract, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { provider, program, connection,getEscrowStatePDA } = useLocalSolana();
  const {getAccountInfo} = useShyft();


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      var escrowStateAddress;
      if(method =="escrowState"){
        escrowStateAddress = getEscrowStatePDA(contractAddress);
        console.log('LocalSolana Account',escrowStateAddress?.toBase58());
      if(!escrowStateAddress){
        setData(null);
        setLoading(false);
        setError('Unable to find LocalSolana account');
        return;
      }
    }
    if(!escrowStateAddress && !contractAddress){
      setError('Error in address');
      setData(null);
      setLoading(false);
      return;
    }
      const publicKey = method =="escrowState"?escrowStateAddress:new PublicKey(contractAddress);
      try {
        if (!connection) {
          setError("Connection  not found");
          setLoading(false);
          return;
        }

        const accountInfo = await connection.getAccountInfo(publicKey!);
        const accountBuffer = accountInfo?.data;

        if (!accountBuffer) {
          setError("Unable to retrieve account information");
          setLoading(false);
          return;
        }
        var decodedData;
        switch (method) {
          case "escrow":
            try {
              decodedData = program?.account.escrow.coder.accounts.decode(
                "escrow",
                accountBuffer
              );
              console.log(decodedData);
            } catch (err) {
              console.log(err);
            }
            break;
          case "fee":
            try {
              var decodedEscrowData =
                program?.account.escrow.coder.accounts.decode(
                  "escrow",
                  accountBuffer
                );
              decodedData = decodedEscrowData.fee ?? new BN(0);
            } catch (err: any) {
              console.log(err);
              setError(err?.toString());
              setData(null);
            }
            break;

            case "escrowState":
              try {
                var decodedEscrowStateData =
                  program?.account.escrowState.coder.accounts.decode(
                    "escrowState",
                    accountBuffer
                  );
                decodedData = decodedEscrowStateData!=null?escrowStateAddress:null;
              } catch (err: any) {
                console.log(err);
                setError(err?.toString());
                setData(null);
              }
              break;

        }
        if (decodedData) {
          console.log("Account data", decodedData);
          setData(decodedData);
        } else {
          console.log("Account data not found");
          setError("No data found");
        }
      } catch (err: any) {
        console.error("Account data", err);
        setError(err?.message);
        setData(null);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    if(watch){
      var escrowStateAddress: PublicKey | undefined;
      if(method =="escrowState"){
        escrowStateAddress =  getEscrowStatePDA(contractAddress);
      }
      if(!escrowStateAddress){
        return;
      }
      const publicKey = method =="escrowState"?escrowStateAddress:new PublicKey(contractAddress);
      if(publicKey === undefined){
        return;
      }
      // Subscribe to account changes by watching for account changes
    const subscriptionId = connection?.onAccountChange(publicKey, (updatedAccountInfo) => {
      const accountBuffer = updatedAccountInfo?.data;
      if (!accountBuffer) {
        setError("Unable to retrieve account information");
        setLoading(false);
        return;
      }
      var decodedData;
      switch (method) {
        case "escrow":
          try {
            decodedData = program?.account.escrow.coder.accounts.decode(
              "escrow",
              accountBuffer
            );
          } catch (err) {
            console.log(err);
          }
          break;
        case "fee":
          try {
            var decodedEscrowData =
              program?.account.escrow.coder.accounts.decode(
                "escrow",
                accountBuffer
              );
            decodedData = decodedEscrowData.fee ?? new BN(0);
          } catch (err: any) {
            console.log(err);
            setError(err?.toString());
            setData(null);
          }
          break;

          case "escrowState":
            try {
              var decodedEscrowStateData =
                program?.account.escrowState.coder.accounts.decode(
                  "escrowState",
                  accountBuffer
                );
              decodedData = decodedEscrowStateData!=null?escrowStateAddress:null;
            } catch (err: any) {
              console.log(err);
              setError(err?.toString());
              setData(null);
            }
            break;

      }
      if (decodedData) {
        console.log("Account data", decodedData);
        setData(decodedData);
        setLoading(false);
      } else {
        console.log("Account data not found");
        setError("No data found");
        setLoading(false);
      }
    });

    // Cleanup the subscription on component unmount
    return () => {
      if(subscriptionId)
      connection?.removeAccountChangeListener(subscriptionId);
    };
    }

  }, [contractAddress, method, connection]);

  return { data, loadingContract, error };
};
