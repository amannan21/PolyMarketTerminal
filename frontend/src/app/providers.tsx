"use client"

import React from "react"
import "@rainbow-me/rainbowkit/styles.css"
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit"
import { WagmiConfig, http } from "wagmi"
import { polygon } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const wagmiConfig = getDefaultConfig({
  appName: "Polymarket Terminal",
  projectId: "d17443a8f74388e1225dccf4f64863ac",
  chains: [polygon],
  transports: { [polygon.id]: http() },
})

const queryClient = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  )
} 