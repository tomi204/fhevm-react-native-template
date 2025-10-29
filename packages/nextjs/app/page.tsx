import Link from "next/link";
import { FHECounterDemo } from "./_components/FHECounterDemo";
import { FHECounterWagmiDemo } from "./_components/FHECounterWagmiDemo";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 items-center sm:items-start w-full px-3 md:px-0">
      {/* Navigation Card */}
      <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-xl p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">FHEVM Demos</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/"
            className="p-4 rounded-lg bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 transition-all"
          >
            <h3 className="text-lg font-bold text-blue-900 mb-2">🔢 FHE Counter</h3>
            <p className="text-sm text-blue-700">Encrypted counter with increment/decrement operations</p>
            <p className="text-xs text-blue-600 mt-2">Network: Hardhat (Localhost)</p>
          </Link>
          <Link
            href="/token"
            className="p-4 rounded-lg bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 transition-all"
          >
            <h3 className="text-lg font-bold text-purple-900 mb-2">💎 Confidential Token</h3>
            <p className="text-sm text-purple-700">ERC-20 token with encrypted balances & transfers</p>
            <p className="text-xs text-purple-600 mt-2">Network: Sepolia Testnet</p>
          </Link>
        </div>
      </div>

      <FHECounterWagmiDemo />
    </div>
  );
}
