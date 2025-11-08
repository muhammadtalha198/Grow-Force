'use client';

import { useEffect, useState } from "react";
import Web3 from "web3";
import { MULTI_PRESALE_ABI } from "../../abis/MultiTokenPresale";

const MULTITOKEN_PRESALE_ADDRESS = "0xfe35393DF246f2f8c964A7147290b8C5Ee96C6E7"; // 🧱 tu contrato real

interface ContractData {
  priceETH: number | null;
  tokensSold: number | null;
  roundData: any | null;
}

export default function ContractDebugPanel() {
  const [data, setData] = useState<ContractData>({
    priceETH: null,
    tokensSold: null,
    roundData: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!window.ethereum) throw new Error("No wallet found");
        setLoading(true);

        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(
          MULTI_PRESALE_ABI,
          MULTITOKEN_PRESALE_ADDRESS
        );

        console.log("✅ Connected to contract:", MULTITOKEN_PRESALE_ADDRESS);

        // 🔹 Ejemplo: obtener precio del token de pago (ETH)
        const priceETH = await contract.methods
          .getTokenPrice("0xFaDC538E249e363A46f0651946052Fd869a41140") // test ETH
          .call();
console.log("➡️ Fetched priceETH:", priceETH);
        // 🔹 Ejemplo: obtener datos de ronda o tokens vendidos
        const roundData = await contract.methods.roundData?.().call?.(); // si existe
        const tokensSold = await contract.methods.totalTokensSold?.().call?.();

        setData({
          priceETH: Number(priceETH) / 1e18,
          tokensSold: tokensSold ? Number(tokensSold) / 1e18 : null,
          roundData: roundData || null,
        });
      } catch (err) {
        console.error("❌ Error fetching contract data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-black/60 border border-bg-logo text-white p-4 rounded-md mt-4 text-sm">
      <h2 className="text-lg font-semibold text-bg-logo mb-2">🧩 Smart Contract Debug Panel</h2>

      {loading && <p>Loading data from blockchain...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {data && (
        <div className="space-y-2">
          <p><strong>ETH Price (USD):</strong> {data.priceETH ?? '—'}</p>
          <p><strong>Tokens Sold:</strong> {data.tokensSold ?? '—'}</p>
          <pre className="bg-gray-800 text-xs p-2 rounded">
            {JSON.stringify(data.roundData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
