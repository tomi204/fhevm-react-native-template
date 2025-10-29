# 🚀 How to Run the FHEVM SDK Demo

Complete guide to run the fully implemented FHEVM SDK with wallet integration.

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- Git installed
- A Web3 wallet (MetaMask, Rainbow, etc.)

---

## Quick Start (3 Steps)

### 1. Install Dependencies
```bash
# From the root of the monorepo
npm install
```

### 2. Build the SDK
```bash
cd packages/fhevm-sdk
npm run build
```

### 3. Start Next.js Demo
```bash
cd ../nextjs
npm run dev
```

### 4. Open Browser
```
http://localhost:3001
```

That's it! The demo is running 🎉

---

## What You'll See

### Landing Page
When you first open http://localhost:3001, you'll see:
- A beautiful "Wallet Not Connected" screen
- A "Connect Wallet" button
- Instructions to get started

### After Connecting Wallet
Once you connect your wallet:
- 🔐 **Encrypted Handle** - The raw encrypted counter value
- 🔓 **Decrypted Value** - The decrypted counter (auto-decrypted!)
- ➕ **Increment Button** - Increase counter (auto-encrypts!)
- ➖ **Decrement Button** - Decrease counter (auto-encrypts!)
- 🔄 **Refresh Button** - Manually refresh the value
- ✨ **Features Showcase** - See what SDK features are active
- 📝 **Code Example** - See how simple the code is
- 📊 **Stats** - Code reduction metrics

---

## Full Testing Guide

### Step 1: Connect to Localhost Network

If you want to test with a local blockchain:

```bash
# Terminal 1: Start local network
cd packages/hardhat
npx hardhat node
```

This will:
- Start a local Ethereum node on port 8545
- Create test accounts with ETH
- Deploy FHECounter contract

### Step 2: Deploy Contracts

```bash
# Terminal 2: Deploy contracts
cd packages/hardhat
npx hardhat deploy --network localhost
```

This will:
- Deploy FHECounter to localhost
- Update contract addresses in deployedContracts.ts

### Step 3: Configure Wallet

1. Open MetaMask
2. Add localhost network:
   - Network Name: Localhost
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

3. Import test account:
   - Use private key from hardhat node output

### Step 4: Start Next.js

```bash
# Terminal 3: Start frontend
cd packages/nextjs
npm run dev
```

### Step 5: Test Features

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Select your wallet
   - Approve connection
   - Select localhost network

2. **Read Encrypted Value**
   - Page loads automatically
   - See encrypted handle (0x...)
   - Watch automatic decryption
   - See decrypted value appear

3. **Increment Counter**
   - Enter amount (e.g., 5)
   - Click "Increment by 5"
   - Approve transaction in wallet
   - See success toast
   - Watch value update automatically

4. **Decrement Counter**
   - Enter amount (e.g., 3)
   - Click "Decrement by 3"
   - Approve transaction
   - See success toast
   - Value decreases

5. **Refresh Manually**
   - Click "Refresh" button
   - Watch re-decryption (uses cache!)
   - Value updates instantly

---

## Testing on Testnet

To test on Zama Devnet:

### Step 1: Update Config

Edit `packages/nextjs/lib/fhevm-config.ts`:
```typescript
// Change from localhost to Zama Devnet
chains: [
  {
    id: 8009,
    name: "Zama Devnet",
    rpcUrl: "https://devnet.zama.ai",
    isMock: false,
  },
]
```

### Step 2: Get Testnet Tokens

1. Connect wallet to Zama Devnet
2. Get testnet tokens from faucet

### Step 3: Test Features

Same as localhost testing!

---

## Directory Structure

```
fhevm-react-native-template/
└── packages/
    ├── fhevm-sdk/               ← The SDK
    │   ├── src/
    │   │   ├── config/          ← Config system
    │   │   ├── hooks/           ← All hooks
    │   │   ├── connectors/      ← Wallet connectors
    │   │   └── utils/           ← Utilities
    │   ├── dist/                ← Built SDK
    │   ├── README.md
    │   ├── EXAMPLES.md
    │   ├── QUICK_START.md
    │   ├── IMPLEMENTATION_GUIDE.md
    │   └── package.json
    │
    ├── nextjs/                  ← Demo App
    │   ├── app/
    │   │   ├── _components/
    │   │   │   ├── FHECounterWagmiDemo.tsx  ← Main demo
    │   │   │   └── AdvancedDemo.tsx         ← Advanced features
    │   │   └── page.tsx         ← Home page
    │   ├── components/
    │   │   ├── FhevmWagmiSync.tsx ← Wallet sync
    │   │   └── DappWrapperWithProviders.tsx
    │   ├── lib/
    │   │   └── fhevm-config.ts  ← SDK config
    │   └── package.json
    │
    └── hardhat/                 ← Smart Contracts
        ├── contracts/
        │   └── FHECounter.sol
        └── deploy/
```

---

## Troubleshooting

### "Cannot connect to localhost"
**Solution:** Make sure hardhat node is running
```bash
cd packages/hardhat
npx hardhat node
```

### "Contract not deployed"
**Solution:** Deploy contracts
```bash
cd packages/hardhat
npx hardhat deploy --network localhost
```

### "Wrong network"
**Solution:** Switch wallet to correct network
- Check wallet network matches config
- For localhost: Chain ID 31337
- For Zama Devnet: Chain ID 8009

### "Transaction rejected"
**Solution:** Check wallet
- Make sure you have enough ETH
- Approve the transaction in your wallet
- Check gas settings

### "Cannot decrypt"
**Solution:** Wait for transaction to mine
- Transactions take time to mine
- Wait ~2 seconds
- Click refresh if needed

### "Build errors"
**Solution:** Clean and rebuild
```bash
cd packages/fhevm-sdk
npm run clean
npm run build
```

---

## Development Mode

### Watch Mode for SDK
```bash
cd packages/fhevm-sdk
npm run watch
```
This will rebuild SDK on every change.

### Next.js Dev Server
```bash
cd packages/nextjs
npm run dev
```
This will hot-reload on every change.

---

## Production Build

### Build SDK
```bash
cd packages/fhevm-sdk
npm run build
```

### Build Next.js
```bash
cd packages/nextjs
npm run build
npm run start
```

---

## Environment Variables

Optional environment variables for Next.js:

```bash
# .env.local
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_here
```

---

## Testing Checklist

- [ ] SDK builds without errors
- [ ] Next.js starts successfully
- [ ] Wallet connects
- [ ] Can read encrypted value
- [ ] Can decrypt value
- [ ] Can increment counter
- [ ] Can decrement counter
- [ ] Success toasts appear
- [ ] Errors are user-friendly
- [ ] Cache works (fast re-decryption)
- [ ] Refresh button works
- [ ] All UI elements render correctly

---

## Performance Monitoring

### Check Build Size
```bash
cd packages/fhevm-sdk
npm run build
ls -lh dist/
```

### Check Page Load Time
Open browser dev tools → Network tab
- Initial load should be <3s
- Subsequent loads <100ms (cached)

### Check Decryption Time
Watch the "Decrypting..." indicator
- First decrypt: 1-2s (normal)
- Cached decrypt: <100ms (instant!)

---

## Advanced Testing

### Test Batch Transactions
1. Navigate to Advanced Demo tab
2. Add multiple operations to batch
3. Execute batch
4. Watch progress bar
5. See individual results

### Test Operator Management
1. Component auto-checks operator status
2. If not operator, auto-setup runs
3. Watch status change to "✅ Operator Ready"

### Test Cache
1. Decrypt a value
2. Click refresh
3. Notice instant result (from cache)
4. Wait 60 seconds (TTL)
5. Refresh again
6. Notice slight delay (cache expired)

### Test Error Handling
1. Try to transact without gas
2. See user-friendly error: "Insufficient funds"
3. Reject transaction in wallet
4. See error: "Transaction rejected by user"

---

## Scripts Reference

### SDK Package
```bash
npm run build       # Build SDK
npm run watch       # Build SDK in watch mode
npm run clean       # Clean dist folder
npm run test        # Run tests
npm run test:watch  # Run tests in watch mode
```

### Next.js Package
```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run linter
npm run check-types # Type check
```

### Hardhat Package
```bash
npx hardhat node                    # Start local node
npx hardhat deploy --network localhost  # Deploy contracts
npx hardhat test                    # Run tests
```

---

## Success Indicators

You know everything is working when you see:

✅ SDK builds without errors
✅ Next.js starts on http://localhost:3001
✅ Page loads with "Connect Wallet" button
✅ Wallet connects successfully
✅ Encrypted handle appears
✅ Value decrypts automatically
✅ Increment/decrement work
✅ Success toasts appear
✅ No console errors
✅ Beautiful UI renders

---

## Getting Help

If you run into issues:

1. **Check console** for errors
2. **Check this guide** for solutions
3. **Read documentation** in README.md
4. **Check examples** in EXAMPLES.md
5. **Review implementation** in IMPLEMENTATION_GUIDE.md

---

## Next Steps

After successfully running the demo:

1. ✅ Read the [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
2. ✅ Study the [Examples](./EXAMPLES.md)
3. ✅ Build your own app using the SDK
4. ✅ Join our community on Discord

---

## Summary

**You now have a fully functional FHE SDK running!**

Features you can use:
- ✅ Auto-encryption
- ✅ Auto-decryption
- ✅ Native caching
- ✅ Wallet integration
- ✅ Error handling
- ✅ Batch transactions
- ✅ Operator management

**Happy building with FHE! 🚀🔐**
