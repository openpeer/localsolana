import 'tailwindcss/tailwind.css';
import type { AppProps } from 'next/app';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import Head from 'app/head';


const AuthLayout = dynamic(() => import('./AuthLayout'), { ssr: false });
const NoAuthLayout = dynamic(() => import('./NoAuthLayout'), { ssr: false });

const App = ({ Component, pageProps,router}: AppProps) => {
	const { simpleLayout } = pageProps;
	return (

		<DynamicContextProvider
        settings={{
          environmentId: "61e5473a-281c-4dbc-89d6-5d1a3061d835",
          walletConnectors: [SolanaWalletConnectors],
          siweStatement: "Welcome to Local Solana. ",
        }}
      >
        <Head />
        {simpleLayout ? (
          <NoAuthLayout pageProps={pageProps} Component={Component} router={router}/>  // Pass Component
        ) : (
          <AuthLayout pageProps={pageProps} Component={Component} router={router}/>  // Pass pageProps
        )}
      </DynamicContextProvider>

	);
};

export default App;
