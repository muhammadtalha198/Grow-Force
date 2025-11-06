'use client';


import { useState, useEffect } from "react";
import { useAccount, useSignMessage, useWalletClient } from "wagmi";
import snsWebSdk from "@sumsub/websdk";
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


const Currencies = [
 { name: "Ethereum", symbol: "ETH", iconURL: "img/currencies/ETH.png", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
 { name: "USD Coin", symbol: "USDC", iconURL: "img/currencies/USDC.png", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
 { name: "Tether USD", symbol: "USDT", iconURL: "img/currencies/USDT.png", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
 { name: "Chainlink", symbol: "LINK", iconURL: "img/currencies/LINK.png", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA" },
 { name: "Wrapped BNB", symbol: "WBNB", iconURL: "img/currencies/WBNB.png", address: "0x...WBNB_ADDRESS" },
 { name: "Wrapped Ethereum", symbol: "WETH", iconURL: "img/currencies/WETH.png", address: "0x...WETH_ADDRESS" },
 { name: "Wrapped Bitcoin", symbol: "WBTC", iconURL: "img/currencies/WBTC.png", address: "0x...WBTC_ADDRESS" },
];


// Contract configuration
const PRESALE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PRESALE_CONTRACT_ADDRESS || "0x...PRESALE_CONTRACT_ADDRESS";
const NATIVE_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // ETH native address
const PRESALE_ABI = [
 "function buyWithNativeVoucher(address beneficiary, tuple(address buyer, address beneficiary, address paymentToken, uint256 usdLimit, uint256 nonce, uint256 deadline, address presale) voucher, bytes signature) external payable",
 "function buyWithTokenVoucher(address token, uint256 amount, address beneficiary, tuple(address buyer, address beneficiary, address paymentToken, uint256 usdLimit, uint256 nonce, uint256 deadline, address presale) voucher, bytes signature) external"
];
// Authorizer ABI (minimal)
const AUTHORIZER_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_signer",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "ECDSAInvalidSignature",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "length",
          "type": "uint256"
        }
      ],
      "name": "ECDSAInvalidSignatureLength",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "s",
          "type": "bytes32"
        }
      ],
      "name": "ECDSAInvalidSignatureS",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InsufficientLimit",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidNonce",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidPaymentToken",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidPresaleAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidShortString",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidSignature",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidSigner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "str",
          "type": "string"
        }
      ],
      "name": "StringTooLong",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "VoucherAlreadyConsumed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "VoucherExpired",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ZeroAddress",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "name": "AuthorizationFailed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [],
      "name": "EIP712DomainChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "oldSigner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newSigner",
          "type": "address"
        }
      ],
      "name": "SignerUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "voucherHash",
          "type": "bytes32"
        }
      ],
      "name": "VoucherConsumed",
      "type": "event"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "buyer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "beneficiary",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "paymentToken",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "usdLimit",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "nonce",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "presale",
              "type": "address"
            }
          ],
          "internalType": "struct Authorizer.Voucher",
          "name": "voucher",
          "type": "tuple"
        },
        {
          "internalType": "bytes",
          "name": "signature",
          "type": "bytes"
        },
        {
          "internalType": "address",
          "name": "paymentToken",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "usdAmount",
          "type": "uint256"
        }
      ],
      "name": "authorize",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "consumedVouchers",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "eip712Domain",
      "outputs": [
        {
          "internalType": "bytes1",
          "name": "fields",
          "type": "bytes1"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "version",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "chainId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "verifyingContract",
          "type": "address"
        },
        {
          "internalType": "bytes32",
          "name": "salt",
          "type": "bytes32"
        },
        {
          "internalType": "uint256[]",
          "name": "extensions",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getDomainSeparator",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getNonce",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "buyer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "beneficiary",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "paymentToken",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "usdLimit",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "nonce",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "presale",
              "type": "address"
            }
          ],
          "internalType": "struct Authorizer.Voucher",
          "name": "voucher",
          "type": "tuple"
        }
      ],
      "name": "invalidateVoucher",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "voucherHash",
          "type": "bytes32"
        }
      ],
      "name": "isVoucherConsumed",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "nonces",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newSigner",
          "type": "address"
        }
      ],
      "name": "setSigner",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "signer",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "buyer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "beneficiary",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "paymentToken",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "usdLimit",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "nonce",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "presale",
              "type": "address"
            }
          ],
          "internalType": "struct Authorizer.Voucher",
          "name": "voucher",
          "type": "tuple"
        },
        {
          "internalType": "bytes",
          "name": "signature",
          "type": "bytes"
        },
        {
          "internalType": "address",
          "name": "paymentToken",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "usdAmount",
          "type": "uint256"
        }
      ],
      "name": "validateVoucher",
      "outputs": [
        {
          "internalType": "bool",
          "name": "valid",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
];
  

// ERC20 ABI for token approval
const ERC20_ABI = [
 "function approve(address spender, uint256 amount) external returns (bool)",
 "function allowance(address owner, address spender) external view returns (uint256)",
 "function decimals() external view returns (uint8)"
];


const PresaleForm = () => {
 const [loading, setLoading] = useState(false);
 const [isVerified, setIsVerified] = useState(false);
 const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'verified', 'rejected'
 const [selectedCurrency, setSelectedCurrency] = useState('ETH');
 const [amount, setAmount] = useState(0);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<'US' | 'Other'>('Other');
  const { address, isConnected } = useAccount();
 const { signMessageAsync } = useSignMessage();
 const { data: walletClient } = useWalletClient();


 // Check verification status from backend
 const checkVerificationStatus = async (userId: string) => {
   if (!userId) return;


   try {


     console.log("➡️ userId:", userId);


     const url = `${process.env.NEXT_PUBLIC_API_URL1 || 'https://dynastical-xzavier-unsanguinarily.ngrok-free.dev'}/api/verify/status/${userId}`;
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
     // Check immediately when wallet connects
     checkVerificationStatus(address);
    
     // Poll every 2 minutes to check if verification was completed
     // (in case webhook updates status in backend)
     const pollInterval = setInterval(() => {
       checkVerificationStatus(address);
     }, 120000);


     return () => clearInterval(pollInterval);
   } else {
     // Reset when wallet disconnects
     setIsVerified(false);
     setVerificationStatus('pending');
   }
 }, [isConnected, address]);


 const startVerification = async (countryCode: 'US' | 'Other') => {
  try {
    setLoading(true);

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'https://dynastical-xzavier-unsanguinarily.ngrok-free.dev'}/api/verify/start`, {
      userId: address,
      email: "user@example.com",
      phone: "+1234567890",
      country: countryCode === 'US' ? 'US' : 'Other',
    });

    const { token } = response.data;
    console.log("✅ Access token received:", token, "Response:", response.data);

    const snsWebSdkInstance = snsWebSdk
      .init(token, () => Promise.resolve(token))
      .withConf({
        lang: "en",
        theme: "dark",
      })
      .withOptions({
        addViewportTag: false,
        adaptIframeHeight: true,
      })
      .on("idCheck.onStepCompleted", (payload) => {
        console.log("✅ Verification step completed:", payload);
        if (address) {
          setTimeout(() => checkVerificationStatus(address), 3000);
        }
      })
      .on("idCheck.onError", (error) => {
        console.error("❌ SDK Error:", error);
        setVerificationStatus('rejected');
        setIsVerified(false);
      })
      .build();

    snsWebSdkInstance.launch("#sumsub-websdk-container");
  } catch (err: any) {
    console.error("❌ Error starting verification:", err);
    if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
      alert("Cannot connect to backend server. Make sure it's running on port 3000.");
    } else if (err.response?.status === 404) {
      alert("Backend API endpoint not found. Check if the server is running correctly.");
    } else {
      alert(`Failed to start verification: ${err.response?.data?.error || err.message}`);
    }
  } finally {
    setLoading(false);
  }
 };

 const handleVerifyClick = () => {
  setShowCountryModal(true);
 };

 const handleCountryConfirm = async () => {
  setShowCountryModal(false);
  const code = selectedCountry === 'US' ? 'US' : 'Other';
  await startVerification(code);
 };

 const handleBuyTokens = async () => {
  
  if (!isConnected || !address) return alert("Please connect your wallet first");
  if (!amount || amount <= 0) return alert("Please enter a valid amount to purchase");
  // if (!isVerified) return alert("Please complete verification first");

  console.log("💰 Purchase Request:", { amount, selectedCurrency, address });

  try {
    setLoading(true);

    // ---- Step 1: Setup ----
    if (!walletClient) throw new Error("Wallet not connected");

    const provider = new ethers.BrowserProvider(walletClient);
    const signer = await provider.getSigner();

    const selectedCurrencyData = Currencies.find(c => c.symbol === selectedCurrency);
    const isNative = selectedCurrency === "ETH";
    const paymentToken = isNative
      ? NATIVE_ADDRESS
      : selectedCurrencyData?.address || NATIVE_ADDRESS;

    console.log("🔗 Payment token:", paymentToken);

    // ---- Step 2: Fetch nonce ----
    const authAddr = process.env.NEXT_PUBLIC_AUTHORIZER_CONTRACT_ADDRESS;
    if (!authAddr) throw new Error("NEXT_PUBLIC_AUTHORIZER_CONTRACT_ADDRESS not set");

    console.log("🔗 Authorizer address:", authAddr);
    console.log("🔗 0xdC99B6D27297d4593673b9A3FAA2dcaE72A45506:");
    console.log("🌐 Chain ID:", await provider.getNetwork());
    

    // const authorizer = new ethers.Contract(authAddr, AUTHORIZER_ABI, provider);
    // const nonce = await authorizer.nonces(address);
    const authorizer = new ethers.Contract(authAddr, AUTHORIZER_ABI, provider);
    const nonce = await authorizer.getNonce("0xYourWalletAddress");
    console.log(nonce.toString());

    console.log("✅ Nonce:", nonce);

    // ---- Step 3: Get token decimals ----
    let decimals = 18;
    if (!isNative) {
      try {
        const decContract = new ethers.Contract(paymentToken, ERC20_ABI, provider);
        decimals = await decContract.decimals();
      } catch {
        console.warn("⚠️ Could not fetch token decimals, defaulting to 18");
      }
    }

    // ---- Step 4: Request voucher ----
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://dynastical-xzavier-unsanguinarily.ngrok-free.dev";

    const { data } = await axios.post(`${apiUrl}/api/presale/voucher`, {
      buyer: address,
      beneficiary: address,
      paymentToken:paymentToken,
      usdAmount: amount,
      userId: address,
      usernonce: nonce,
      decimals: decimals,
    });

    const { voucher, signature } = data;
    console.log("🎫 Voucher received:", { voucher, signature });

    // ---- Step 5: Contract interaction ----
    const presaleContract = new ethers.Contract(
      PRESALE_CONTRACT_ADDRESS,
      PRESALE_ABI,
      signer
    );

    const voucherStruct = [
      voucher.buyer,
      voucher.beneficiary,
      voucher.paymentToken,
      voucher.usdLimit,
      voucher.nonce,
      voucher.deadline,
      voucher.presale,
    ];

    const beneficiary = address;
    let tx;

    if (isNative) {
      // Native purchase
      const ethAmount = ethers.parseEther(amount.toString());
      console.log("💰 Buying with native:", ethAmount.toString());

      tx = await presaleContract.buyWithNativeVoucher(
        beneficiary,
        voucherStruct,
        signature,
        { value: ethAmount }
      );
    } else {
      // ERC20 purchase
      const tokenContract = new ethers.Contract(paymentToken, ERC20_ABI, signer);
      const tokenAmount = ethers.parseUnits(amount.toString(), decimals);

      const allowance = await tokenContract.allowance(address, PRESALE_CONTRACT_ADDRESS);
      console.log("💳 Current allowance:", allowance.toString());

      if (allowance < tokenAmount) {
        console.log("🔐 Approving token spending...");
        const approveTx = await tokenContract.approve(PRESALE_CONTRACT_ADDRESS, tokenAmount);
        await approveTx.wait();
        console.log("✅ Approval confirmed");
      }

      tx = await presaleContract.buyWithTokenVoucher(
        paymentToken,
        tokenAmount,
        beneficiary,
        voucherStruct,
        signature
      );
    }

    console.log("⏳ Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed:", receipt);

    alert(`Purchase successful! TX: ${tx.hash}`);
  } catch (err: any) {
    console.error("❌ Error buying tokens:", err);
    const msg =
      err.response?.data?.error || err.reason || err.message || "Unknown error";
    alert(`Failed to buy tokens: ${msg}`);
  } finally {
    setLoading(false);
  }
};


 return (
   <>
   <form id="presale-form" className="relative max-w-[720px] py-4 px-4 md:px-6 md:py-8 mb-4 rounded-md border border-body-text overflow-hidden">
     <FormTitle />
     <TokenPrice title="1 $ESCROW" subtitle="$0.015" />
     <SupplyStatus presaleSupply={8000000} tokensSold={1923400} />


     <div className="w-full h-[1px] my-4 bg-body-text rounded-full"></div>


     <h2 className="text-bg-logo font-semibold text-sm md:text-base">You deposit</h2>
     <div className="md:mb-2 mb-1 mt-2 mx-auto flex items-center justify-center flex-wrap md:gap-2 gap-1">
       {Currencies.slice(0, 4).map((currency, i) => (
         <CurrencyRadio 
           key={i} 
           symbol={currency.symbol} 
           iconURL={currency.iconURL}
           selectedCurrency={selectedCurrency}
           onCurrencyChange={setSelectedCurrency}
         />
       ))}
     </div>
     <div className="mb-3 mx-auto flex items-center justify-center flex-wrap md:gap-2 gap-1">
       <div className="flex-[0.5_1_0]"></div>
       {Currencies.slice(4, 7).map((currency, i) => (
         <CurrencyRadio 
           key={i} 
           symbol={currency.symbol} 
           iconURL={currency.iconURL}
           selectedCurrency={selectedCurrency}
           onCurrencyChange={setSelectedCurrency}
         />
       ))}
       <div className="flex-[0.5_1_0]"></div>
     </div>


     <CurrentBalance currentBalance={2.3456} currency={{ iconURL: "img/currencies/ETH.png", symbol: "ETH" }} />
     <CurrencyInput
       currencyBalance={2.3456}
       currencyIconURL="img/currencies/ETH.png"
       currencySymbol={selectedCurrency}
       usdValue={1850}
       value={amount}
       onChange={(value) => setAmount(value)}
     />
     <GasFee />


     <TokenPrice title="You will receive" subtitle="166K $ESCROW" />
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

    {/* 🔹 Country selection modal */}
    {showCountryModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white text-black w-[90%] max-w-sm rounded-lg p-4 shadow-xl">
          <h3 className="text-lg font-semibold mb-3">Select your country</h3>
          <label className="block text-sm mb-2">Country</label>
          <select
            className="w-full border rounded-md p-2 mb-4"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value === 'US' ? 'US' : 'Other')}
          >
            <option value="US">United States</option>
            <option value="Other">Other</option>
          </select>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-md border"
              onClick={() => setShowCountryModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-md border border-bg-logo text-bg-logo hover:bg-bg-logo hover:text-black"
              onClick={handleCountryConfirm}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )}


     <TermsCheckbox />
     <img id="bg-form" src="/img/form-bg.jpg" className="absolute opacity-15 w-full h-full inset-0 -z-50" alt="" />
   </form>
  <button
    type="button"
    disabled={loading || !isConnected}
    onClick={handleBuyTokens}
    className={`w-full py-3 md:py-4 mt-2 font-medium border text-sm md:text-base tracking-tight rounded-full cursor-pointer duration-200 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {loading ? 'Testing Purchase...' : 'Test Buy (dev)'}
  </button>
 
 </>
 );
};


export default PresaleForm;


//  const handleBuyTokens = async () => {
//    if (!isConnected || !address) {
//      alert("Please connect your wallet first");
//      return;
//    }


//    // if (!isVerified) {
//    //   alert("Please complete verification first");
//    //   return;
//    // }


//    if (!amount || amount <= 0) {
//      alert("Please enter an amount to purchase");
//      return;
//    }


//    console.log("💰 Amount:", amount);
//    console.log("💰 Selected currency:", selectedCurrency);
//    console.log("💰 Address:", address);


//    try {
//      setLoading(true);


//      // Step 1: Prepare currency data
//      const selectedCurrencyData = Currencies.find(c => c.symbol === selectedCurrency);
//      const isNativeCurrency = selectedCurrency === 'ETH';
//      const paymentTokenAddress = isNativeCurrency ? NATIVE_ADDRESS : (selectedCurrencyData?.address || NATIVE_ADDRESS);


//     console.log("Step 2: Fetch user nonce from Authorizer and request voucher from backend");
//     // Ensure wallet is connected before using BrowserProvider
//     if (!walletClient) {
//       throw new Error("Wallet not connected");
//     }
    
//     const provider = new ethers.BrowserProvider(walletClient);
//     // Fetch nonce from Authorizer
    
//     const authAddr = process.env.NEXT_PUBLIC_AUTHORIZER_CONTRACT_ADDRESS;
//     if (!authAddr) throw new Error("NEXT_PUBLIC_AUTHORIZER_CONTRACT_ADDRESS not set");
    
//     const authorizer = new ethers.Contract(authAddr, AUTHORIZER_ABI, provider);
//     const chainNonce = await authorizer.getNonce(address);

//     console.log("✅ Chain nonce:", chainNonce);

//     console.log("✅ Address:", address);
//     console.log("✅ Payment token address:", paymentTokenAddress);
//     console.log("✅ USD amount:", amount);
//     console.log("✅ User ID:", address);
//     console.log("✅ User nonce:", chainNonce?.toString?.());

//     // Determine token decimals (18 for native ETH, query ERC20 otherwise)
//     let tokenDecimals = 18;
//     if (!isNativeCurrency) {
//       try {
//         const decContract = new ethers.Contract(paymentTokenAddress, ERC20_ABI, provider);
//         tokenDecimals = await decContract.decimals();
//       } catch (e) {
//         console.warn("Could not fetch token decimals (pre-voucher), defaulting to 18:", e);
//         tokenDecimals = 18;
//       }
//     }

//     // Step 2: Request voucher from backend including user nonce and token decimals
//     const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'https://dynastical-xzavier-unsanguinarily.ngrok-free.dev'}/api/presale/voucher`, {
//       buyer: address,
//       beneficiary: address,
//       paymentToken: paymentTokenAddress,
//       usdAmount: amount,
//       userId: address,
//       usernonce: chainNonce?.toString?.(),
//       decimals: tokenDecimals
//     });


//      console.log(" Voucher response:", response.data);


//      const { voucher, signature } = response.data;
//      console.log(" Voucher received:", { voucher, signature });


//      console.log("Step 3: Create contract instances");
//      // Step 3: Create contract instances
//      if (!walletClient) {
//        throw new Error("Wallet not connected");
//      }

//      console.log(" PRESALE_CONTRACT_ADDRESS:", PRESALE_CONTRACT_ADDRESS);


//     // provider already created above
//      const signer = await provider.getSigner();
//      const presaleContract = new ethers.Contract(PRESALE_CONTRACT_ADDRESS, PRESALE_ABI, signer);
    
//      // Prepare voucher struct for contract call
//      const voucherStruct = [
//        voucher.buyer,
//        voucher.beneficiary,
//        voucher.paymentToken,
//        voucher.usdLimit,
//        voucher.nonce,
//        voucher.deadline,
//        voucher.presale
//      ];

//      const beneficiary = address; // User's wallet address
     
//      let tx;


//      if (isNativeCurrency) {
//        // Step 4a: Purchase with native ETH using buyWithNativeVoucher
//        const ethAmount = ethers.parseEther(amount.toString()); // Convert to wei
      
//        console.log("💰 Purchasing with ETH:", {
//          amount: ethAmount.toString(),
//          beneficiary,
//          voucher,
//          signature
//        });


//        // Call buyWithNativeVoucher with msg.value
//        tx = await presaleContract.buyWithNativeVoucher(
//          beneficiary,
//          voucherStruct,
//          signature,
//          { value: ethAmount } // Send ETH with the transaction
//        );
//      } else {
//        // Step 4b: Purchase with ERC20 token using buyWithTokenVoucher
//        // First, get token decimals (default to 18 if not available)
//       const tokenContract = new ethers.Contract(paymentTokenAddress, ERC20_ABI, signer);
//       let tokenDecimals: number;
//       try {
//         tokenDecimals = await tokenContract.decimals();
//       } catch (e) {
//         console.error("Could not fetch token decimals from token contract:", e);
//         alert("Failed to read token decimals from the token contract.");
//         setLoading(false);
//         return;
//       }


//        const tokenAmount = ethers.parseUnits(amount.toString(), tokenDecimals);
      
//        console.log("💳 Purchasing with token:", {
//          token: paymentTokenAddress,
//          amount: tokenAmount.toString(),
//          decimals: tokenDecimals,
//          beneficiary,
//          voucher,
//          signature
//        });


//        // Check current allowance
//        const currentAllowance = await tokenContract.allowance(address, PRESALE_CONTRACT_ADDRESS);
//        console.log("Current allowance:", currentAllowance.toString());


//        // Approve token spending if needed
//        if (currentAllowance < tokenAmount) {
//          console.log("Approving token spending...");
//          const approveTx = await tokenContract.approve(PRESALE_CONTRACT_ADDRESS, tokenAmount);
//          console.log("Approval transaction submitted:", approveTx.hash);
//          await approveTx.wait();
//          console.log("✅ Token approved");
//        }


//        // Call buyWithTokenVoucher
//        tx = await presaleContract.buyWithTokenVoucher(
//          paymentTokenAddress,
//          tokenAmount,
//          beneficiary,
//          voucherStruct,
//          signature
//        );
//      }


//      console.log("Transaction submitted:", tx.hash);
    
//      // Wait for transaction confirmation
//      const receipt = await tx.wait();
//      console.log("Transaction confirmed:", receipt);


//      alert(`Purchase successful! Transaction hash: ${tx.hash}`);
//      console.log("✅ Token purchase completed successfully!");


//    } catch (err: any) {
//      console.error("❌ Error buying tokens:", err);
//      const errorMessage = err.response?.data?.error || err.reason || err.message || "Unknown error";
//      alert(`Failed to buy tokens: ${errorMessage}`);
//    } finally {
//      setLoading(false);
//    }
//  };
