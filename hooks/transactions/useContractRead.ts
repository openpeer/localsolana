// hooks/transactions/useContractRead.ts

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import useLocalSolana from "./useLocalSolana";

export const useContractRead = (
  contractAddress: string,
  method: string
) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { program, connection, getConnection } = useLocalSolana();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (!connection) {
          throw new Error("Connection not established");
        }

        if (!contractAddress) {
          throw new Error("Contract address is required");
        }

        const publicKey = new PublicKey(contractAddress);
        const accountInfo = await getConnection().getAccountInfo(publicKey);

        if (!accountInfo?.data) {
          throw new Error("Unable to retrieve account information");
        }

        // Decode data using the Anchor program
        const decodedData = program?.account[method]?.coder?.accounts.decode(
          method,
          accountInfo.data
        );

        setData(decodedData || null);
      } catch (err: any) {
        console.error("Error fetching contract data:", err.message);
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contractAddress, method, connection]);

  return { data, loading, error };
};
