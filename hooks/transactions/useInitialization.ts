import { useState, useEffect } from 'react';
import useLocalSolana from './useLocalSolana';
import { useContractRead } from './useContractRead';
import { PublicKey } from '@solana/web3.js';

export interface InitializationState {
  isConnectionReady: boolean;
  isProgramReady: boolean;
  isContractReady: boolean;
  error: string | null;
}

/**
 * Hook to manage initialization sequence of Solana connection, program, and contract
 * Provides a single source of truth for application readiness
 */
export const useInitialization = (contractAddress: string) => {
  const [state, setState] = useState<InitializationState>({
    isConnectionReady: false,
    isProgramReady: false,
    isContractReady: false,
    error: null
  });

  const { connection, program } = useLocalSolana();
  const { data: escrowData, loading, error } = useContractRead(contractAddress, "escrowState", true);

  useEffect(() => {
    // Update connection state
    setState(prev => ({
      ...prev,
      isConnectionReady: !!connection
    }));
  }, [connection]);

  useEffect(() => {
    // Update program state
    setState(prev => ({
      ...prev,
      isProgramReady: !!program
    }));
  }, [program]);

  useEffect(() => {
    // Update contract state - consider it ready if we have data and it's not loading
    const isReady = escrowData !== null && escrowData !== undefined && !loading;
    console.debug("[useInitialization] Contract state:", { 
      escrowData, 
      loading, 
      isReady,
      error: error 
    });
    
    setState(prev => ({
      ...prev,
      isContractReady: isReady,
      error: error
    }));
  }, [escrowData, error, loading]);

  // Computed property for overall readiness
  const isReady = state.isConnectionReady && state.isProgramReady && state.isContractReady;

  return {
    ...state,
    isReady
  };
}; 