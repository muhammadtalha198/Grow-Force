import { useEffect, useState } from "react";
import Web3 from "web3";
import { MULTI_PRESALE_ABI } from "../abis/MultiTokenPresale";
import { ADDRESSES } from "../constants";

export function usePresaleContractData(userAddress, selectedToken) {
  const [data, setData] = useState({
    presaleSupply: 0,
    tokensSold: 0,
    escrowPriceUSD: 0,
    paymentTokenPriceUSD: 0,
    userBalance: 0,
    escrowBalance: 0,
    loading: true,
    error: "",
  });

  useEffect(() => {
    if (!window?.ethereum || !selectedToken) return;

    const fetchData = async () => {
      try {
        setData((prev) => ({ ...prev, loading: true, error: "" }));

        const web3 = new Web3(window.ethereum);
        const presale = new web3.eth.Contract(
          MULTI_PRESALE_ABI,
          ADDRESSES.PRESALE_TOKEN
        );

        // 🔹 Leer supply y tokens vendidos (round data)
        const roundData = await presale.methods.roundData().call();
        const tokensSold =
          Number(roundData.round1Sold) / 1e18 + Number(roundData.round2Sold) / 1e18;
        const presaleSupply =
          (Number(roundData.round1Sold) +
            Number(roundData.round1Remaining) +
            Number(roundData.round2Sold) +
            Number(roundData.round2Remaining)) /
          1e18;

        // 🔹 Precio del token ESCROW (token de la preventa)
        const rawEscrowPrice = await presale.methods
          .getTokenPrice(ADDRESSES.PRESALE_TOKEN)
          .call();
        const escrowPriceUSD = Number(rawEscrowPrice) / 1e18;

        // 🔹 Precio del token de pago seleccionado (ETH, USDC, etc.)
        const rawPaymentTokenPrice = await presale.methods
          .getTokenPrice(selectedToken)
          .call();
        const paymentTokenPriceUSD = Number(rawPaymentTokenPrice) / 1e18;

        // 🔹 Balance del usuario del token seleccionado
        let userBalance = 0;
        if (userAddress) {
          const erc20 = new web3.eth.Contract(MULTI_PRESALE_ABI, selectedToken);
          const rawBalance = await erc20.methods.balanceOf(userAddress).call();
          const decimals = await erc20.methods.decimals().call();
          userBalance = Number(rawBalance) / 10 ** Number(decimals);
        }

        // 🔹 Balance del usuario en $ESCROW (opcional)
        let escrowBalance = 0;
        if (userAddress) {
          const escrowToken = new web3.eth.Contract(
            ERC20_ABI,
            ADDRESSES.PRESALE_TOKEN
          );
          const rawBalance = await escrowToken.methods.balanceOf(userAddress).call();
          escrowBalance = Number(rawBalance) / 1e18;
        }

        setData({
          presaleSupply,
          tokensSold,
          escrowPriceUSD,
          paymentTokenPriceUSD,
          userBalance,
          escrowBalance,
          loading: false,
          error: "",
        });
      } catch (err) {
        console.error("❌ Error fetching presale data:", err);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Error fetching data",
        }));
      }
    };

    fetchData();
  }, [userAddress, selectedToken]);

  return data;
}
