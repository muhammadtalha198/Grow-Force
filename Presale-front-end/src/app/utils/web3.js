import Web3 from "web3";

export function getWeb3() {
  if (!window?.ethereum) throw new Error("No wallet (window.ethereum) found");
  return new Web3(window.ethereum);
}

export function getContract(abi, address) {
  const web3 = getWeb3();
  return new web3.eth.Contract(abi, address);
}
