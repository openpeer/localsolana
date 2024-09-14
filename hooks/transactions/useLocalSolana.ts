import { LocalSolanaMigrate } from './../../idl/local_solana_migrate';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3, Wallet } from '@coral-xyz/anchor';
import idl from '../../idl/local_solana_migrate.json'; // Adjust the path to your IDL file
import { CURRENT_NETWORK } from 'utils';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Keypair } from '@solana/web3.js';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { IDL } from '@coral-xyz/anchor/dist/cjs/native/system';
import * as anchor from "@coral-xyz/anchor";
import { LocalSolanaMigrate } from '../../idl/local_solana_migrate';
import { Transaction } from '@solana/web3.js';

const useCustomProgram = () => {
  const [program, setProgram] = useState<Program<LocalSolanaMigrate> | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const { primaryWallet } = useDynamicContext();

  useEffect(() => {
    const initializeProgram = async () => {
      const connection = new Connection(CURRENT_NETWORK, 'confirmed');
      if (!(primaryWallet?.connected)) {
        return;
      }
      const key = Uint8Array.from(bs58.decode(primaryWallet?.key));
      const providerInstance = new AnchorProvider(connection, new Wallet(Keypair.fromSecretKey(key)), {
        preflightCommitment: 'confirmed',
      });
      const programId = new PublicKey(idl.address);
      const programInstance = anchor.workspace.LocalSolanaMigrate as  Program<LocalSolanaMigrate>;

      setProvider(providerInstance);
      setProgram(programInstance);
    };

    initializeProgram();
  }, [primaryWallet]);

  const executeCustomInstruction = async (params: any) => {
    if (!program || !provider) {
      throw new Error('Program or provider is not initialized');
    }

    const tx = new Transaction().add(
                  await program.methods
                    .initialize(new anchor.BN(50), new anchor.BN(1000000), process.env.FEE_RECEPIENT)
                    .accounts({
                      seller: seller.publicKey,
                      arbitrator: feeRecipientandArbitrator,
                      feeRecipient: feeRecipientandArbitrator,
                    })
                    //.signers([seller])
                    .instruction()
                );

    return tx;
  };

  return { program, provider, executeCustomInstruction };
};

export default useCustomProgram;