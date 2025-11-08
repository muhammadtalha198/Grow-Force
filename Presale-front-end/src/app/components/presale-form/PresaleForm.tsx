'use client';

import { useState, useEffect } from "react";
import { useAccount, useSignMessage, useWalletClient } from "wagmi";
import { usePresaleData } from "../../hooks/usePresaleData";
import { usePresaleContractData } from "../../hooks/usePresaleContractData";
import axios from "axios";
import { ethers } from "ethers";

import CurrencyInput from "./CurrencyInput";
import CurrencyRadio from "./CurrencyRadio";
import CurrentBalance from "./CurrentBalance";
import FormTitle from "./FormTitle";
import GasFee from "./GasFee";
import SupplyStatus from "./SupplyStatus";
import TermsCheckbox from "./TermsCheckbox";
import TokenBalance from "./TokenBalance";
import TokenPrice from "./TokenPrice";
import VerificationScreen from "./VerificationScreen";
import ContractDebugPanel from "./ContractDebugPanel";
import { MULTI_PRESALE_ABI } from "../../abis/MultiTokenPresale";

const Currencies = [
  { name: "Ethereum", symbol: "ETH", iconURL: "img/currencies/ETH.png", address: "0x0000000000000000000000000000000000000000" },
  { name: "USD Coin", symbol: "USDC", iconURL: "img/currencies/USDC.png", address: "0x...USDC_ADDRESS" },
  { name: "Tether USD", symbol: "USDT", iconURL: "img/currencies/USDT.png", address: "0x...USDT_ADDRESS" },
  { name: "Chainlink", symbol: "LINK", iconURL: "img/currencies/LINK.png", address: "0x...LINK_ADDRESS" },
  { name: "Wrapped BNB", symbol: "WBNB", iconURL: "img/currencies/WBNB.png", address: "0x...WBNB_ADDRESS" },
  { name: "Wrapped Ethereum", symbol: "WETH", iconURL: "img/currencies/WETH.png", address: "0x...WETH_ADDRESS" },
  { name: "Wrapped Bitcoin", symbol: "WBTC", iconURL: "img/currencies/WBTC.png", address: "0x...WBTC_ADDRESS" },
];

// Contract configuration
const PRESALE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PRESALE_CONTRACT_ADDRESS || "0x...PRESALE_CONTRACT_ADDRESS";
const PRESALE_ABI = MULTI_PRESALE_ABI || [
  "function buyWithTokenVoucher(address token, uint256 amount, address beneficiary, tuple(address buyer, address beneficiary, address paymentToken, uint256 usdLimit, uint256 nonce, uint256 deadline, address presale) voucher, bytes signature) external"
];

const TOTAL_PRESALE_SUPPLY = 5_000_000_000; // 5B tokens

const PresaleForm = () => {
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'verified', 'rejected'
  const [selectedCurrency, setSelectedCurrency] = useState('ETH');
  const [amount, setAmount] = useState(0);
  const [showVerificationScreen, setShowVerificationScreen] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(0);
  
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { data: walletClient } = useWalletClient();
  const { data: presaleData, loading: presaleLoading, error: presaleError } = usePresaleData(address) as any;

  const selectedCurrencyData = Currencies.find(
    (c) => c.symbol === selectedCurrency
  );

  const {
    presaleSupply,
    tokensSold,
    escrowPriceUSD,
    paymentTokenPriceUSD,
    userBalance,
    escrowBalance,
    loading: dataLoading,
  } = usePresaleContractData(address, selectedCurrencyData?.address);

  // Check verification status from backend
  const checkVerificationStatus = async (userId: string) => {
    if (!userId) return;

    try {

      console.log("➡️ userId:", userId);

      const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://3c2b50be615a.ngrok-free.app'}/api/verify/status/${userId}`;
      console.log("➡️ Fetching verification status from:", url);

      const response = await axios.get(url);

      console.log("✅ Verification status checked:", response.data);
      console.log("✅ response.data.verified:", response.data.verified);
      console.log("✅ response.data.status:", response.data.status);
      console.log("✅ response.data:", response.data);
      
      if (response.data.verified === true) {
        setIsVerified(true);
        setVerificationStatus('verified');
      } else {
        setIsVerified(false);
        setVerificationStatus(response.data.status || 'pending');
      }
    } catch (err: any) {
      console.error("❌ Error checking verification status:", err);
      // Don't update state on error, keep current status
    }
  };

  // Check verification status when wallet connects or address changes
  useEffect(() => {
    if (isConnected && address) {
      console.log("✅ Wallet client connected:", walletClient);
      // Check immediately when wallet connects
      checkVerificationStatus(address);
      
      // Poll every 5 seconds to check if verification was completed
      // (in case webhook updates status in backend)
      const pollInterval = setInterval(() => {
        checkVerificationStatus(address);
      }, 5000);

      return () => clearInterval(pollInterval);
    } else {
      // Reset when wallet disconnects
      setIsVerified(false);
      setVerificationStatus('pending');
    }
  }, [isConnected, address]);

  const handleVerifyClick = () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }
    setShowVerificationScreen(true);
  };

  useEffect(() => {
    if (amount > 0 && escrowPriceUSD > 0 && paymentTokenPriceUSD > 0) {
      // Calcular cuántos $ESCROW recibirá el usuario
      const usdValue = amount * paymentTokenPriceUSD;
      const escrowTokens = usdValue / escrowPriceUSD;
      setTokenAmount(escrowTokens);
    } else {
      setTokenAmount(0);
    }
  }, [amount, escrowPriceUSD, paymentTokenPriceUSD]);

  const handleBuyTokens = async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!isVerified) {
      alert("Please complete verification first");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Please enter an amount to purchase");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Prepare currency data
      const selectedCurrencyData = Currencies.find(c => c.symbol === selectedCurrency);

      // Step 2: Request voucher from backend
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'https://3c2b50be615a.ngrok-free.app'}/api/presale/voucher`, {
        buyer: address,
        beneficiary: address,
        paymentToken: selectedCurrencyData?.address || '0x0000000000000000000000000000000000000000',
        usdAmount: amount * 1850, // Convert to USD (example rate)
        userId: address
      });

      const { voucher, signature } = response.data;
      console.log("✅ Voucher received:", { voucher, signature });

      // Step 3: Prepare contract call parameters
      const tokenAddress = selectedCurrencyData?.address || '0x0000000000000000000000000000000000000000';
      const tokenAmount = ethers.parseUnits(amount.toString(), 18); // Convert to wei (18 decimals)
      const beneficiary = address; // User's wallet address
      
      // Step 4: Create contract instance and call
      if (!walletClient) {
        throw new Error("Wallet not connected");
      }

      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      const presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, PRESALE_ABI, signer);
      
      console.log("Calling presale contract...", {
        token: tokenAddress,
        amount: tokenAmount.toString(),
        beneficiary,
        voucher,
        signature
      });

      // Prepare voucher struct for contract call
      const voucherStruct = [
        voucher.buyer,
        voucher.beneficiary,
        voucher.paymentToken,
        voucher.usdLimit,
        voucher.nonce,
        voucher.deadline,
        voucher.presale
      ];

      // Call the contract function
      const tx = await presaleContract.buyWithTokenVoucher(
        tokenAddress,
        tokenAmount,
        beneficiary,
        voucherStruct,
        signature
      );

      console.log("Transaction submitted:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      alert(`Purchase successful! Transaction hash: ${tx.hash}`);
      console.log("✅ Token purchase completed successfully!");

    } catch (err: any) {
      console.error("❌ Error buying tokens:", err);
      alert(`Failed to buy tokens: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Verification screen (overlay fullscreen) */}
      {showVerificationScreen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <VerificationScreen
            userId={address}
            onClose={() => {
              setShowVerificationScreen(false);
              if (address) checkVerificationStatus(address);
            }}
          />
        </div>
      )}

      <form id="presale-form" className="relative max-w-[720px] py-4 px-4 md:px-6 md:py-8 mb-4 rounded-md border border-body-text overflow-hidden">
        <FormTitle />
        <TokenPrice
          title="1 $ESCROW"
          subtitle={loading ? "Loading..." : `$${escrowPriceUSD.toFixed(4)}`}
        />

        <SupplyStatus
          presaleSupply={loading ? 0 : presaleSupply}
          tokensSold={loading ? 0 : tokensSold}
        />

        <div className="w-full h-[1px] my-4 bg-body-text rounded-full"></div>

        <h2 className="text-bg-logo font-semibold text-sm md:text-base">You deposit</h2>
        <div className="mx-auto max-w-[600px] grid grid-cols-4 gap-3 justify-items-center mt-4 mb-6">
          {Currencies.map((currency, i) => (
            <div
              key={i}
              onClick={() => setSelectedCurrency(currency.symbol)}
              className={`cursor-pointer rounded-lg border px-3 py-2 flex flex-col items-center justify-center transition
                ${selectedCurrency === currency.symbol
                  ? 'border-bg-logo bg-bg-logo/20'
                  : 'border-transparent hover:bg-white/5'}
              `}
            >
              <CurrencyRadio symbol={currency.symbol} iconURL={currency.iconURL} />
              <span className="text-xs mt-1 text-bg-logo">{currency.symbol}</span>
            </div>
          ))}
        </div>

        <CurrentBalance
          currentBalance={loading ? 0 : userBalance}
          currency={{
            iconURL: selectedCurrencyData?.iconURL || "img/currencies/ETH.png",
            symbol: selectedCurrencyData?.symbol || "ETH",
          }}
        />

        <CurrencyInput
          currencyBalance={loading ? 0 : userBalance}
          currencyIconURL={selectedCurrencyData?.iconURL || "img/currencies/ETH.png"}
          currencySymbol={selectedCurrencyData?.symbol || "ETH"}
          usdValue={loading ? 0 : paymentTokenPriceUSD}
          value={amount}
          onChange={(value) => setAmount(value)}
        />

        <GasFee />
        <TokenPrice
          title="You will receive"
          subtitle={
            loading
              ? "Calculating..."
              : tokenAmount > 0
                ? `${tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} $ESCROW`
                : "—"
          }
        />
        <TokenBalance />

        {/* 🔹 Verification/Buy button */}
        <button
          type="button"
          disabled={loading || !isConnected}
          onClick={isVerified ? handleBuyTokens : handleVerifyClick}
          className={`w-full py-3 md:py-4 mt-4 font-medium border text-sm md:text-base tracking-tight rounded-full cursor-pointer duration-200 ${
            isVerified 
              ? 'border-green-500 text-green-500 hover:bg-green-500 hover:text-black' 
              : 'border-bg-logo text-bg-logo hover:text-black hover:border-bg-logo hover:bg-bg-logo'
          } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading 
            ? (isVerified ? "Processing Purchase..." : "Launching Verification...") 
            : !isConnected 
              ? "Connect Wallet First" 
              : isVerified 
                ? "Buy Tokens Now" 
                : "Get verified to buy"
          }
        </button>

        {/* 🔹 Sumsub Web SDK iframe container */}
        <div id="sumsub-websdk-container" className="mt-4"></div>

        {(isConnected && isVerified) && <TermsCheckbox />}
        <img id="bg-form" src="/img/form-bg.jpg" className="absolute opacity-15 w-full h-full inset-0 -z-50" alt="" />
      </form>
       {/* <ContractDebugPanel /> */}
    </>
  );
};

export default PresaleForm;
