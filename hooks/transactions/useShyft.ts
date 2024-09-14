// useShyft.ts
import { useState, useEffect } from 'react';
import { Network, ShyftSdk } from '@shyft-to/js';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { CURRENT_NETWORK } from 'utils';

const useShyft = () => {
  const [shyft, setShyft] = useState<ShyftSdk | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);

  useEffect(() => {
    const initializeShyft = async () => {
        const shyftInstance = new ShyftSdk({
            apiKey: "JwpOxgz2GUG8VMpA",
            network: CURRENT_NETWORK,
          });
      const connectionInstance = new Connection(CURRENT_NETWORK, 'confirmed');
      setShyft(shyftInstance);
      setConnection(connectionInstance);
    };

    initializeShyft();
  }, []);

  const sendTransactionWithShyft = async (
    transaction: Transaction,
    signers: Keypair[]
  ) => {
    const connection = new Connection("https://api.devnet.solana.com");
    const recentBlockhash = await connection.getRecentBlockhash();
    console.log("Recent blockhash: " + recentBlockhash.blockhash);
    transaction.recentBlockhash = recentBlockhash.blockhash;
    transaction.feePayer = new PublicKey(
      "2Hu9fgnKUWyxqGwLVLhoUPsG9PJ15YbNxB8boWmCdSqC"
    );
    //shyft.wallet.transaction({})
    transaction.partialSign(...signers);
    // for (let index = 0; index < signers.length; index++) {
    //   const element = signers[index];

    // }

    // Serialize the transaction
    let serializedTransaction = transaction.serialize({
      requireAllSignatures: false, // or true, based on your use case
      verifySignatures: true, // or true, based on your use case
    });

    // Convert serialized transaction to base64 string
    let base64Transaction = Buffer.from(serializedTransaction).toString(
      "base64"
    );
    console.log("Tansaction is " + base64Transaction);

    const signature = await shyft?.txnRelayer.sign({
      encodedTransaction: base64Transaction,
      network: Network.Devnet,
    });
    console.log("Signed Tansaction is " + signature);
    try {
      // const signature = await connection.sendEncodedTransaction(
      //   signedTransaction
      // );
      //await connection.confirmTransaction(signature, "confirmed");
      console.log(signature);
      return signature;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
    
  };

  return { shyft, connection, sendTransactionWithShyft };
};

export default useShyft;