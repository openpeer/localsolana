// import { FC, ReactNode, useMemo } from 'react';
// import {
//     ConnectionProvider,
//     WalletProvider
// } from '@solana/wallet-adapter-react';
// import {
//     PhantomWalletAdapter,
//     SolflareWalletAdapter,
//     TorusWalletAdapter
// } from '@solana/wallet-adapter-wallets';
// import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
// import { clusterApiUrl } from '@solana/web3.js';
// import '@solana/wallet-adapter-react-ui/styles.css'; // Default styles for wallet connection UI
// import { CURRENT_NETWORK } from '@/utils';

// interface SolanaWalletProviderProps {
//     children: ReactNode;
// }

// const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
//     const network = CURRENT_NETWORK; // Or 'mainnet-beta', 'testnet'

//     // Configure the network connection
//     const endpoint = useMemo(() => clusterApiUrl(network), [network]);

//     // Wallet adapters
//     const wallets = useMemo(
//         () => [
//             new PhantomWalletAdapter(),
//             new SolflareWalletAdapter(),
//             new TorusWalletAdapter(),
//         ],
//         []
//     );

//     return (
//         <ConnectionProvider endpoint={endpoint}>
//             <WalletProvider wallets={wallets} autoConnect>
//                 <WalletModalProvider>{children}</WalletModalProvider>
//             </WalletProvider>
//         </ConnectionProvider>
//     );
// };

// export default SolanaWalletProvider;
