import { Connection } from "@solana/web3.js";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { NEXT_PUBLIC_SOLANA_RPC } from 'utils';

interface ConnectionContextType {
  connection: Connection | null;
  getConnection: () => Connection;
}

const ConnectionContext = createContext<ConnectionContextType | null>(null);

let cachedConnection: Connection | null = null;

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const connectionRef = useRef<Connection | null>(null);

  useEffect(() => {
    const initializeConnection = async () => {
      if (!cachedConnection) {
        const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
        const rpcUrl = `${NEXT_PUBLIC_SOLANA_RPC}?api-key=${apiKey}`;
        
        cachedConnection = new Connection(rpcUrl, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000
        });
      }
      connectionRef.current = cachedConnection;
    };

    initializeConnection();
    
    return () => {
      connectionRef.current = null;
    };
  }, []);

  const getConnection = () => {
    if (!connectionRef.current) {
      throw new Error("Connection not initialized");
    }
    return connectionRef.current;
  };

  return (
    <ConnectionContext.Provider value={{ connection: connectionRef.current, getConnection }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
};