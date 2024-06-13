"use client";

import React, { ReactNode } from "react";
import { config, projectId } from "./config";

import { createWeb3Modal } from "@web3modal/wagmi/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { State, WagmiProvider } from "wagmi";

// Setup queryClient
const queryClient = new QueryClient();

if (!projectId) throw new Error("Project ID is not defined");

// Create modal
createWeb3Modal({
    wagmiConfig: config,
    projectId,
    enableAnalytics: false, // Optional - defaults to your Cloud configuration
    enableOnramp: false, // Optional - false as default
});

export default function Web3ModalProvider({
    children,
}: {
    children: ReactNode;
    initialState?: State;
}) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
