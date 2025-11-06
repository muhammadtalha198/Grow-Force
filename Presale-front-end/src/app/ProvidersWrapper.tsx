'use client';

import { darkTheme, getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { WagmiProvider } from "wagmi";
import { base, mainnet } from "wagmi/chains";

// Create QueryClient outside component to ensure it's only created once
// This prevents Wagmi/RainbowKit from reinitializing on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const config = getDefaultConfig({
  appName: 'Escrow Presale',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_ACTUAL_PROJECT_ID',
  chains: [mainnet, base],
  ssr: true
});

const ProvidersWrapper = ({ children }: PropsWithChildren) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          { children }
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
 
export default ProvidersWrapper;