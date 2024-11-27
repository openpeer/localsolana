// hooks/transactions/useLocalSolana.ts

import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet, SolanaWallet } from "@dynamic-labs/solana-core";
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState, useRef } from "react";
import { NEXT_PUBLIC_SOLANA_RPC } from 'utils';
import idl from "../../idl/local_solana_migrate.json";
import { LocalSolanaMigrate } from "../../idl/local_solana_migrate";
import { Helius } from "helius-sdk";

const useLocalSolana = () => {
  const [program, setProgram] = useState<Program<LocalSolanaMigrate> | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [helius, setHelius] = useState<Helius | null>(null);
  const { primaryWallet } = useDynamicContext();
  const connectionRef = useRef<Connection | null>(null);

useEffect(() => {
  const initializeLocalSolana = async () => {
    try {
      if (!NEXT_PUBLIC_SOLANA_RPC) {
        throw new Error("Solana RPC URL is not set");
      }

      const connectionInstance = new Connection(NEXT_PUBLIC_SOLANA_RPC, { commitment: "confirmed" });
      setConnection(connectionInstance);
      connectionRef.current = connectionInstance;

      // Rest of the code...
    } catch (error) {
      console.error("Error initializing Solana connection:", error);
    }
  };

  initializeLocalSolana();
}, [primaryWallet]);

  const getConnection = (): Connection => {
    if (!connectionRef.current) {
      throw new Error("Connection is not initialized");
    }
    return connectionRef.current;
  };

  return {
    program,
    provider,
    connection,
    helius,
    getConnection,
    idl
  };
};

export default useLocalSolana;
