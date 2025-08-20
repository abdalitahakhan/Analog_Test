// ZeroDev Configuration
// Uses EntryPoint 0.7 with Kernel v3.1 (recommended for new projects)
export const ZERODEV_CONFIG = {
  projectId: import.meta.env.VITE_REACT_APP_ZERODEV_PROJECT_ID || "",
  bundlerUrl: import.meta.env.VITE_REACT_APP_ZERODEV_BUNDLER_URL || ``,
  paymasterUrl: import.meta.env.VITE_REACT_APP_ZERODEV_PAYMASTER_URL || ``,
  chain: "sepolia", // Using Sepolia testnet as recommended
  chainId: 11155111, // Sepolia testnet
}
export const EXPLORER_URL = 'https://sepolia.etherscan.io/';


export const TOKEN_CONFIG = {
  // Sepolia test USDC token address - Mock USDC
  contractAddress: "0x2b9Ca0A8C773bb1B92A3dDAE9F882Fd14457DACc", // Sepolia Mock USDC
  decimals: 6, // USDC has 6 decimals
  symbol: "USDC",
  name: "USD Coin (Mock)"
}

// ERC20 ABI (minimal for our needs)
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' }
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'SepoliaETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/', 'https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
}
