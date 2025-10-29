# Reown (WalletConnect) Integration Guide

This guide shows you how to use the native Reown integration in the FHEVM SDK.

## What is Reown?

Reown (formerly WalletConnect) is the leading protocol for connecting wallets to dApps. It supports 300+ wallets and provides:
- QR code wallet connection
- Mobile wallet deep linking
- Multi-chain support
- WalletConnect v3 protocol

## Quick Start

### 1. Switch to Reown Provider

Replace `DappWrapperWithProviders` with `DappWrapperWithReown` in your layout:

```typescript
// app/layout.tsx
import { DappWrapperWithReown } from "~~/components/DappWrapperWithReown";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DappWrapperWithReown>{children}</DappWrapperWithReown>
      </body>
    </html>
  );
}
```

### 2. Use the ConnectButton

```typescript
import { ConnectButton } from "fhevm-sdk";

export function MyComponent() {
  return (
    <ConnectButton
      label="Connect Wallet"
      showNetwork={true}
      showBalance={false}
    />
  );
}
```

### 3. Interact with Encrypted Contracts

```typescript
import { useReadContract, useWriteContract } from "fhevm-sdk";
import { useAccount } from "wagmi";

export function MyCounter() {
  const { isConnected } = useAccount();

  // Auto-decryption!
  const { decryptedData: value } = useReadContract({
    name: "FHECounter",
    functionName: "getCount",
    enabled: isConnected,
  });

  // Auto-encryption!
  const { write } = useWriteContract({ name: "FHECounter" });

  const increment = () => write({
    functionName: "increment",
    args: [1], // Automatically encrypted
  });

  return (
    <div>
      <p>Count: {value?.toString()}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

## Configuration

The Reown integration uses your existing `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` from `scaffold.config.ts`.

To get a project ID:
1. Go to https://cloud.reown.com/
2. Create a new project
3. Copy your Project ID
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   ```

## Features

### Automatic FHEVM Sync

The `ReownProvider` automatically syncs wallet state with FHEVM context:
- ✅ Account address
- ✅ Chain ID
- ✅ Signer
- ✅ Provider

No manual setup required!

### Native ConnectButton

The SDK includes a pre-built `ConnectButton` component:

```typescript
<ConnectButton
  label="Connect Wallet"      // Button text
  showNetwork={true}           // Show network switcher
  showBalance={false}          // Show wallet balance
  className="custom-class"     // Custom styling
/>
```

### AppKit Modal

Use the Reown AppKit modal directly:

```typescript
import { useAppKit } from "@reown/appkit/react";

function MyComponent() {
  const { open } = useAppKit();

  return (
    <button onClick={() => open()}>
      Open Wallet Modal
    </button>
  );
}
```

## Demo Page

Visit `/reown-demo` to see a complete working example of:
- Wallet connection with Reown
- Reading encrypted values
- Writing encrypted values
- Auto-decryption
- Native caching

## Comparison: RainbowKit vs Reown

| Feature | RainbowKit | Reown |
|---------|-----------|-------|
| Wallet Support | Good | Excellent (300+) |
| Mobile Support | Good | Excellent |
| SDK Integration | Manual sync | Automatic sync |
| Connect Button | Customizable | Built-in |
| QR Scanning | ✅ | ✅ |
| Deep Linking | ✅ | ✅ |
| WalletConnect v3 | ✅ | ✅ (Native) |

## Troubleshooting

### "Module not found: @reown/appkit"

Install dependencies:
```bash
pnpm install
```

### "Invalid project ID"

Make sure `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` is set in your environment variables.

### "Cannot find wagmiAdapter"

The Reown configuration is in `services/web3/reownConfig.tsx`. Make sure it's properly imported.

## Advanced Usage

### Custom Metadata

```typescript
<ReownProvider
  wagmiAdapter={wagmiAdapter}
  projectId={projectId}
  metadata={{
    name: "My FHEVM dApp",
    description: "Encrypted smart contracts",
    url: "https://my-dapp.com",
    icons: ["https://my-dapp.com/icon.png"],
  }}
>
  {children}
</ReownProvider>
```

### Network Switching

```typescript
import { useAppKit } from "@reown/appkit/react";

function NetworkSwitcher() {
  const { open } = useAppKit();

  return (
    <button onClick={() => open({ view: "Networks" })}>
      Switch Network
    </button>
  );
}
```

## Support

For issues with:
- **FHEVM SDK**: Check the SDK documentation
- **Reown/WalletConnect**: Visit https://docs.reown.com/
- **Wallet connections**: Check browser console for errors

## Next Steps

1. Try the demo at `/reown-demo`
2. Customize the `ConnectButton` styling
3. Build encrypted contract interactions
4. Deploy to production with your Reown Project ID
