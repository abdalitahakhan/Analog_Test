export interface User {
  email: string;
  name: string;
  picture: string;
  smartWalletAddress: string;
}

export interface Transaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  type: 'transfer' | 'batch';
  amount?: string;
  recipient?: string;
  timestamp: number;
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  address: string;
}

export interface TransferFormData {
  recipient: string;
  amount: string;
}

export interface BatchTransferFormData {
  recipient: string;
  amount: string;
  approveAmount: string;
}