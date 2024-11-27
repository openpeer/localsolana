import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import useLocalSolana from "./useLocalSolana";
import { BN } from "@coral-xyz/anchor";

interface ContractReadResult {
  data: any;
  fee: bigint | null;
  loadingContract: boolean;
}

export const useContractRead = (
  contractAddress: string | null,
  method: string
): ContractReadResult => {
  const [fee, setFee] = useState<bigint | null>(null);
  const [data, setData] = useState<any>(null);
  const [loadingContract, setLoading] = useState(true);
  const { program, getConnection, getEscrowStatePDA, isConnectionReady } = useLocalSolana();

  useEffect(() => {
    const fetchData = async () => {

      // If contractAddress is null, skip fetching
      if (!contractAddress) {
        setLoading(false);
        return;
      }

      // Check if connection is ready
      if (!isConnectionReady) {
      console.warn("Connection is not ready");
      setLoading(false);
      return;
    }

      // Check if connection and program are available
      if (!program) {
        console.warn("Program not established");
        setLoading(false);
        return;
      }

      // Check if contract address is provided
      if (!contractAddress) {
        console.warn("Contract address is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let publicKey: PublicKey;
        if (method === "escrowState") {
          // Get the PDA for the escrow state
          const escrowStateAddress = getEscrowStatePDA(contractAddress);
          if (!escrowStateAddress) {
            console.warn("Unable to find LocalSolana account");
            setLoading(false);
            return;
          }
          publicKey = escrowStateAddress;
        } else {
          publicKey = new PublicKey(contractAddress);
        }

        console.log("Fetching account info for publicKey:", publicKey.toBase58());

        // Fetch account information
        const accountInfo = await getConnection().getAccountInfo(publicKey);
        if (!accountInfo?.data) {
          console.warn("Unable to retrieve account information");
          setLoading(false);
          return;
        }

        // Decode data based on the method
        let decodedData;
        switch (method) {
          case "escrow":
            decodedData = program.account.escrow.coder.accounts.decode(
              "escrow",
              accountInfo.data
            );
            if (decodedData?.fee) {
              setFee(BigInt(decodedData.fee.toString()));
            }
            break;

          case "escrowState":
            decodedData = program.account.escrowState.coder.accounts.decode(
              "escrowState",
              accountInfo.data
            );

            if (decodedData?.fee) {
              setFee(BigInt(decodedData.fee.toString()));
            }

            setData(decodedData);

          default:
            console.warn(`Unsupported method: ${method}`);
            setLoading(false);
            return;
        }
      } catch (err: any) {
        console.error("Error fetching contract data:", err.message);
        setFee(null);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contractAddress, method, program, isConnectionReady]);

  return { fee, data, loadingContract };
};