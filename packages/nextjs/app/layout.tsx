import { ClientLayout } from "~~/components/ClientLayout";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/helper/getMetadata";

export const metadata = getMetadata({
  title: "Zama Template",
  description: "Built with FHEVM and Reown",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=telegraf@400,500,700&display=swap"
          rel="stylesheet"
        />
        {/* FHEVM Relayer SDK - Required for encryption */}
        <script
          src="https://cdn.jsdelivr.net/gh/zama-ai/fhevm@v0.6.0-0/fhevm.js"
          async
        />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
