import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import useLocalSolana from "./useLocalSolana";
import { BN } from "@coral-xyz/anchor";
import useHelius from "./useHelius";

export const useContractRead = (
  contractAddress: string,
  method: string,
  watch?: boolean
) => {
  const [data, setData] = useState<any>(null);
  const [loadingContract, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { program, connection, getEscrowStatePDA } = useLocalSolana();
  const { getAccountInfo } = useHelius();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!connection) {
          throw new Error("Connection not established");
        }

        if (!contractAddress) {
          throw new Error("Contract address is required");
        }

        let escrowStateAddress: PublicKey | undefined;
        if (method === "escrowState") {
          escrowStateAddress = getEscrowStatePDA(contractAddress);
          if (!escrowStateAddress) {
            throw new Error("Unable to find LocalSolana account");
          }
        }

        const publicKey =
          method === "escrowState"
            ? escrowStateAddress
            : new PublicKey(contractAddress);

        if (!publicKey) {
          throw new Error("Invalid contract address or escrow state address");
        }

        console.log("Fetching account info for:", publicKey.toBase58());

        // Fetch account info using Helius
        const accountInfo = await getAccountInfo(publicKey.toBase58());
        if (!accountInfo || !accountInfo.data) {
          throw new Error("Unable to retrieve account information");
        }

        const accountBuffer = accountInfo.data;
        let decodedData;

        switch (method) {
          case "escrow":
            decodedData = program?.account.escrow.coder.accounts.decode(
              "escrow",
              accountBuffer
            );
            break;

          case "fee":
            const decodedEscrowData =
              program?.account.escrow.coder.accounts.decode(
                "escrow",
                accountBuffer
              );
            decodedData = decodedEscrowData?.fee ?? new BN(0);
            break;

          case "escrowState":
            const decodedEscrowStateData =
              program?.account.escrowState.coder.accounts.decode(
                "escrowState",
                accountBuffer
              );
            decodedData = decodedEscrowStateData ? escrowStateAddress : null;
            break;

          default:
            throw new Error("Unsupported method");
        }

        if (decodedData) {
          console.log("Decoded account data:", decodedData);
          setData(decodedData);
        } else {
          throw new Error("No data found");
        }
      } catch (err: any) {
        console.error("Error fetching contract data:", err);
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (watch) {
      let escrowStateAddress: PublicKey | undefined;
      if (method === "escrowState") {
        escrowStateAddress = getEscrowStatePDA(contractAddress);
      }

      const publicKey =
        method === "escrowState"
          ? escrowStateAddress
          : new PublicKey(contractAddress);

      if (!publicKey) {
        console.error("Invalid public key for subscription");
        return;
      }

      console.log("Subscribing to account changes for:", publicKey.toBase58());

      const subscriptionId = connection?.onAccountChange(
        publicKey,
        async (updatedAccountInfo) => {
          try {
            const accountBuffer = updatedAccountInfo?.data;
            if (!accountBuffer) {
              throw new Error("Unable to retrieve updated account information");
            }

            let decodedData;

            switch (method) {
              case "escrow":
                decodedData = program?.account.escrow.coder.accounts.decode(
                  "escrow",
                  accountBuffer
                );
                break;

              case "fee":
                const decodedEscrowData =
                  program?.account.escrow.coder.accounts.decode(
                    "escrow",
                    accountBuffer
                  );
                decodedData = decodedEscrowData?.fee ?? new BN(0);
                break;

              case "escrowState":
                const decodedEscrowStateData =
                  program?.account.escrowState.coder.accounts.decode(
                    "escrowState",
                    accountBuffer
                  );
                decodedData = decodedEscrowStateData
                  ? escrowStateAddress
                  : null;
                break;

              default:
                throw new Error("Unsupported method");
            }

            if (decodedData) {
              console.log("Updated account data:", decodedData);
              setData(decodedData);
            } else {
              throw new Error("No updated data found");
            }
          } catch (err: any) {
            console.error("Error processing updated account data:", err);
            setError(err.message);
            setData(null);
          }
        }
      );

      // Cleanup the subscription on component unmount
      return () => {
        if (subscriptionId) {
          console.log("Removing subscription for:", publicKey.toBase58());
          connection?.removeAccountChangeListener(subscriptionId);
        }
      };
    }
  }, [contractAddress, method, connection, watch]);

  return { data, loadingContract, error };
};
