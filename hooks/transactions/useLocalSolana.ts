import { LocalSolanaMigrate } from './../../idl/local_solana_migrate';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import idl from '../../idl/local_solana_migrate.json'; 
import { CURRENT_NETWORK, CURRENT_NETWORK_URL } from 'utils';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Keypair } from '@solana/web3.js';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import * as anchor from "@coral-xyz/anchor";
import { Transaction } from '@solana/web3.js';
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { isSolanaWallet, SolanaWallet } from '@dynamic-labs/solana-core';

const useLocalSolana = () => {
  const [program, setProgram] = useState<Program<LocalSolanaMigrate> | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const { primaryWallet } = useDynamicContext();
 
  const [myWallet, setMyWallet] = useState<SolanaWallet | null>(null);
  const [keypair, setKeyPair] = useState<Keypair | null>(null);

  useEffect(() => {
    const initializeProgram = async () => {
      const connection = new Connection(CURRENT_NETWORK_URL, 'confirmed');
      if (!(primaryWallet?.isConnected )) {
        console.error('Wallet is not there');
        return;
      }
      if(!isSolanaWallet(primaryWallet)) {
        return;
      }
      const key = Uint8Array.from(bs58.decode(primaryWallet?.key));
      const provider = new AnchorProvider(connection, primaryWallet, { commitment: 'processed' });
       const program = new Program<LocalSolanaMigrate>(idl as LocalSolanaMigrate,provider);

      setProvider(provider);
      setProgram(program);
      setMyWallet(primaryWallet);
    };

    initializeProgram();
  }, [primaryWallet]);

  const initialiseSolanaAccount = async (address: string) => {
    if (!program || !provider) {
      throw new Error('Program or provider is not initialized');
    }
    const arbitrator = 'FAsF12aNXnsJ8rcg2BzAWxG1KZxboDttbzjqz5qPsAV1';//process.env.NEXT_ARBITRATOR_ADDRESS;
    const feeRecepient = 'DrkhNqVahiYsC8f6vfRj7cabECXr9mo9Siyet4JTCmow';//process.env.NEXT_FEE_RECEPIENT;
    console.log(`arbitrator ${arbitrator} fee: ${feeRecepient}`);
    if(!arbitrator || !feeRecepient){
      throw new Error('Please set arbitrator and fee recepient in env');
    }

    const tx = new Transaction().add(
                  await program.methods
                    .initialize(new anchor.BN(50), new anchor.BN(1000000), new PublicKey(feeRecepient))
                    .accounts({
                      seller: primaryWallet?.address,
                      arbitrator: arbitrator,
                      feeRecipient: feeRecepient,
                    })
                    //.signers([seller])
                    .instruction()
                );

    return tx;
  };

  return { program, provider,myWallet, initialiseSolanaAccount };
};

export default useLocalSolana;