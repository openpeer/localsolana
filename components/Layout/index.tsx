import 'tailwindcss/tailwind.css';
import type { AppProps } from 'next/app';
import { DynamicContextProvider, DynamicEmbeddedWidget, DynamicMultiWalletPromptsWidget } from '@dynamic-labs/sdk-react-core';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import Head from 'app/head';
import { MessageContextProvider } from '@/contexts/MessageContext';
import SolanaWalletProvider from '@/providers/SolanaWalletProvider';
import { TransactionFeedbackProvider } from '@/contexts/TransactionFeedContext';


const AuthLayout = dynamic(() => import('./AuthLayout'), { ssr: false });
const NoAuthLayout = dynamic(() => import('./NoAuthLayout'), { ssr: false });

const App = ({ Component, pageProps,router}: AppProps) => {
	const { simpleLayout } = pageProps;
  const [messageToSign, setMessageToSign] = useState('');
	const [signedMessage, setSignedMessage] = useState('');
	return (

		<DynamicContextProvider
        settings={{
          environmentId: "61e5473a-281c-4dbc-89d6-5d1a3061d835",
          walletConnectors: [SolanaWalletConnectors],
          initialAuthenticationMode:simpleLayout?'connect-only':"connect-and-sign",
          siweStatement: "Welcome to Local Solana. ",
          eventsCallbacks: {
            onSignedMessage: async ({ messageToSign: msg, signedMessage: signature }) => {
              setMessageToSign(msg);
              setSignedMessage(signature);
            },
            onLogout: () => {
              setMessageToSign('');
              setSignedMessage('');
            }
          },
        }} 
      >
       <TransactionFeedbackProvider>
        <Head />
        <MessageContextProvider messageToSign={messageToSign} signedMessage={signedMessage}>
        {simpleLayout ? (
          <NoAuthLayout pageProps={pageProps} Component={Component} router={router}/>  // Pass Component
        ) : (
          <AuthLayout pageProps={pageProps} Component={Component} router={router}/>  // Pass pageProps
        )}
        </MessageContextProvider>
        </TransactionFeedbackProvider>
      </DynamicContextProvider>

	);
};

export default App;
