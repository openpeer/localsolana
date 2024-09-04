import 'tailwindcss/tailwind.css';
import type { AppProps } from 'next/app';

import dynamic from 'next/dynamic';
import React from 'react';

const Layout = dynamic(() => import('../components/Layout'), { ssr: false });

const App = ({ Component, pageProps,router }: AppProps) => <Layout pageProps={pageProps} Component={Component} router={router} />;

export default App;
