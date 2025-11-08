// hooks/usePresaleData.ts
import { useEffect, useState } from "react";
import Web3 from "web3";
import { MULTI_PRESALE_ABI } from "../abis/MultiTokenPresale";
import { ADDRESSES } from "../constants";

export function usePresaleData(userAddress) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tokenAddress = "0x077967B291E4B2233A8A05d4ea0AAC3407Ed2daD"; // Presale token (ESCROW)

  useEffect(() => {
    let web3;
    let contract;

    async function loadData() {
      try {
        if (!window?.ethereum) throw new Error("No wallet found");
        web3 = new Web3(window.ethereum);
        contract = new web3.eth.Contract(MULTI_PRESALE_ABI, ADDRESSES.MULTI_PRESALE);

        const [
          tokensData,
          presaleStatus,
          roundData,
          remainingTokens,
          isActive,
          tokenPriceData
        ] = await Promise.all([
          contract.methods.getSupportedTokens().call(),
          contract.methods.getPresaleStatus().call(),
          contract.methods.getRoundAllocation().call(),
          contract.methods.getRemainingTokens().call(),
          contract.methods.isPresaleActive().call(),
          contract.methods.getTokenPrice(tokenAddress).call()
        ]);

        const userPurchases = userAddress
          ? await contract.methods.getUserPurchases(userAddress).call()
          : null;

        setData({
          tokens: tokensData,
          presaleStatus,
          roundData,
          remainingTokens,
          isActive,
          userPurchases,
          tokenPriceData
        });
      } catch (e) {
        console.error("Error loading presale data:", e);
        setError(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userAddress]);

  return { data, loading, error };
}
