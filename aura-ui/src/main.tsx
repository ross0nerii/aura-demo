import React from "react";
import ReactDOM from "react-dom/client";

// --- очень рано подкидываем polyfills для либ, которые ждут node-глобалы ---
;(window as any).global = (window as any).global ?? window;
;(window as any).process = (window as any).process ?? { env: {} };
// --------------------------------------------------------------------------

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig, WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import App from "./App";

const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL),
  },
});

const qc = new QueryClient();

const root = document.getElementById("root");
if (!root) {
  throw new Error("#root not found in index.html");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <WagmiProvider config={wagmiConfig}>
        <App />
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
