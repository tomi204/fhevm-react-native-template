# Quick Start Guide - React Native FHEVM

Get up and running with the React Native FHEVM app in 5 minutes.

## 1. Get a Reown Project ID

1. Visit [https://cloud.reown.com](https://cloud.reown.com)
2. Create a free account
3. Create a new project
4. Copy your Project ID

## 2. Configure Environment

```bash
cd packages/react-native
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_REOWN_PROJECT_ID=paste_your_project_id_here
```

## 3. Start the Relayer Service

From the **repository root**:

```bash
# First time setup
cd packages/relayer-service
cp .env.example .env
# Edit .env with your Sepolia RPC URL and wallet private key

# Start relayer (from root)
pnpm relayer:dev
```

The relayer should start on `http://localhost:4000`

## 4. Start the React Native App

From the **repository root**:

```bash
# Start Expo
pnpm mobile

# Then press:
# - 'i' for iOS Simulator
# - 'a' for Android Emulator
# - 'w' for Web browser
```

## 5. Connect Your Wallet

1. In the app, tap **"Connect Wallet"**
2. Scan the QR code with your mobile wallet (MetaMask, Rainbow, etc.)
3. Approve the connection
4. You should see your address displayed

## 6. Configure Relayer URL (if needed)

**iOS Simulator**: Works with `http://localhost:4000` (default)

**Android Emulator**:
1. In the app, go to "Relayer Settings"
2. Enter: `http://10.0.2.2:4000`
3. Tap "Apply Override"

**Physical Device**:
1. Find your computer's local IP (e.g., `192.168.1.100`)
2. Enter: `http://192.168.1.100:4000`
3. Ensure device and computer are on same network

## 7. Try FHE Operations

Once connected and the session shows "Ready":

- Tap **"Refresh"** to read the encrypted counter
- Tap **"Increment"** to increase the counter
- Tap **"Decrement"** to decrease the counter

All operations are encrypted/decrypted by the relayer! 🎉

## Troubleshooting

**Relayer connection failed?**
- Check relayer is running: `curl http://localhost:4000` (should return 404, not connection refused)
- Try the correct URL for your platform (see step 6)

**Wallet not connecting?**
- Verify your Reown Project ID in `.env`
- Make sure you're on Sepolia network in your wallet

**App won't start?**
- Run `pnpm install` from repository root
- Clear cache: `pnpm mobile -- --clear`

## What's Next?

Check out the full [README.md](./README.md) for:
- Architecture details
- How the relayer works
- Available hooks and components
- Advanced configuration

## Need Help?

- [Reown Docs](https://docs.reown.com/appkit/react-native/core/installation)
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- [Project Issues](https://github.com/zama-ai/fhevm-react-native-template/issues)
