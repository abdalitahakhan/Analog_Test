import { useState, useEffect, useCallback } from 'react'
import { 
  createKernelAccount, 
  createKernelAccountClient,
  createZeroDevPaymasterClient 
} from '@zerodev/sdk'
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import { 
  http, 
  createPublicClient, 
  parseUnits, 
  encodeFunctionData,
  createWalletClient,
  Address,
  parseAbiItem
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { PrivateKeyAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { ZERODEV_CONFIG, TOKEN_CONFIG, ERC20_ABI } from '../config'
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants'
import type { EntryPointVersion } from 'viem/account-abstraction'
import { Transaction } from '../types'

interface SmartWalletState {
  kernelClient: any | null
  walletAddress: string | null
  isLoading: boolean
  error: string | null
  txHash: string | null
  txStatus: 'idle' | 'pending' | 'success' | 'error'
  txMessage: string
  transactions: Transaction[]
}

export const useSmartWallet = (userEmail?: string) => {
  const [state, setState] = useState<SmartWalletState>({
    kernelClient: null,
    walletAddress: null,
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: 'idle',
    txMessage: '',
    transactions: []
  })

  const updateState = useCallback((updates: Partial<SmartWalletState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const addTransaction = useCallback((transaction: Transaction) => {    
    // Save to localStorage for persistence
    if (state.walletAddress) {
      const storageKey = `transactions_${state.walletAddress}`;
      const existingTxs = localStorage.getItem(storageKey);
      const transactions = existingTxs ? JSON.parse(existingTxs) : [];
      
      transactions.unshift(transaction);
      
      // Keep only last 100 transactions
      const limitedTxs = transactions.slice(0, 100);
      localStorage.setItem(storageKey, JSON.stringify(limitedTxs));
    }
    
    setState(prev => {
      const newState = {
        ...prev,
        transactions: [transaction, ...prev.transactions]
      };
      return newState;
    })
  }, [state.walletAddress])

  const initializeWallet = useCallback(async () => {
    console.log('🔄 initializeWallet: Starting with email:', userEmail);
    
    if (!userEmail) {
      console.log('🔄 initializeWallet: No user email, returning');
      updateState({ error: 'User email is required' })
      return
    }

    try {
      console.log('🔄 initializeWallet: Setting loading state...');
      updateState({ isLoading: true, error: null })

      // Create a deterministic private key from user email
      const encoder = new TextEncoder()
      const data = encoder.encode(userEmail + 'zerodev-salt') // Add salt for security
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const privateKeyArray = new Uint8Array(hashBuffer)
      const privateKey = '0x' + Array.from(privateKeyArray)
        .map(b => b.toString(16).padStart(2, '0')).join('') as `0x${string}`

      // Create public client for the network
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http()
      })

      // Create private key account
      const account: PrivateKeyAccount = privateKeyToAccount(privateKey)

      // Create wallet client
      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http()
      })

      // Create ECDSA validator with v0.7 entry point (recommended for new projects)
      const entryPoint = getEntryPoint("0.7" as EntryPointVersion);
      const kernelVersion = KERNEL_V3_1;
      
      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer: walletClient,
        entryPoint,
        kernelVersion,
      })

      // Create kernel account
      const kernelAccount = await createKernelAccount(publicClient, {
        plugins: {
          sudo: ecdsaValidator,
        },
        entryPoint,
        kernelVersion,
      })

      // Create paymaster client
      const paymasterClient = createZeroDevPaymasterClient({
        chain: sepolia,
        transport: http(`${ZERODEV_CONFIG.paymasterUrl}`),
      })

      // Create kernel client following official documentation
      const kernelClient = createKernelAccountClient({
        account: kernelAccount,
        chain: sepolia,
        bundlerTransport: http(`${ZERODEV_CONFIG.bundlerUrl}`),
        client: publicClient, // Required - the public client
        paymaster: {
          // Optional -- only if you want to use a paymaster
          getPaymasterData(userOperation) {
            return paymasterClient.sponsorUserOperation({ userOperation })
          }
        },
      })

      console.log('🔄 initializeWallet: Wallet initialized with address:', kernelAccount.address);
      updateState({
        kernelClient,
        walletAddress: kernelAccount.address,
        isLoading: false
      })
      console.log('🔄 initializeWallet: State updated, wallet address set to:', kernelAccount.address);
      
      // Load existing transactions from localStorage
      const storageKey = `transactions_${kernelAccount.address}`;
      const existingTxs = localStorage.getItem(storageKey);
      if (existingTxs) {
        try {
          const transactions = JSON.parse(existingTxs);
          setState(prev => ({
            ...prev,
            transactions: transactions
          }));
          
          // Also update the main state
          updateState({
            transactions: transactions
          });
        } catch (err) {
          console.error('Failed to parse stored transactions:', err);
        }
      }
    } catch (err: any) {
      console.error('🔄 initializeWallet: Wallet initialization failed:', err)
      updateState({
        error: err.message || 'Failed to initialize wallet',
        isLoading: false
      })
    }
  }, [userEmail, updateState])

  const sendGaslessTransfer = useCallback(async (to: string, amount: string) => {
    if (!state.kernelClient) {
      throw new Error('Wallet not initialized')
    }

    try {
      updateState({ 
        isLoading: true, 
        txStatus: 'pending', 
        txMessage: 'Sending gasless transfer...',
        error: null 
      })

      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to as Address, parseUnits(amount, TOKEN_CONFIG.decimals)]
      })

      const userOpHash = await state.kernelClient.sendUserOperation({
        calls: [{
          to: TOKEN_CONFIG.contractAddress as Address,
          data: transferData,
          value: BigInt(0),
        }]
      })

      // Wait for the transaction to be confirmed
      const receipt = await state.kernelClient.waitForUserOperationReceipt({
        hash: userOpHash
      })

      const txHash = receipt?.receipt?.transactionHash || userOpHash

      // Add transaction to history
      const transaction: Transaction = {
        hash: txHash,
        status: 'success',
        type: 'transfer',
        amount: amount,
        recipient: to,
        timestamp: Date.now()
      }
      addTransaction(transaction)

      // Refresh balances after successful transaction
      setTimeout(() => {
        if (state.walletAddress) {
          getTokenBalance();
          getEthBalance();
        }
      }, 2000); // Wait 2 seconds for blockchain to update

      updateState({
        txHash,
        txStatus: 'success',
        txMessage: 'Gasless transfer completed successfully!',
        isLoading: false
      })

      return txHash
    } catch (err: any) {
      console.error('Transfer failed:', err)
      updateState({
        error: err.message || 'Transfer failed',
        txStatus: 'error',
        txMessage: err.message || 'Transfer failed',
        isLoading: false
      })
      throw err
    }
  }, [state.kernelClient, updateState])

  const batchApprovalAndTransfer = useCallback(async (to: string, transferAmount: string, approveAmount: string) => {
    if (!state.kernelClient) {
      throw new Error('Wallet not initialized')
    }

    try {
      updateState({ 
        isLoading: true, 
        txStatus: 'pending', 
        txMessage: 'Sending batched approval + transfer...',
        error: null 
      })

      // Approve the recipient to spend a larger amount (useful for future transactions)
      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [to as Address, parseUnits(approveAmount, TOKEN_CONFIG.decimals)]
      })

      // Transfer tokens directly to recipient
      const transferData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [
          to as Address, 
          parseUnits(transferAmount, TOKEN_CONFIG.decimals)
        ]
      })

      // Batch the transactions
      const userOpHash = await state.kernelClient.sendUserOperation({
        calls: [
          {
            to: TOKEN_CONFIG.contractAddress as Address,
            data: approveData,
            value: BigInt(0),
          },
          {
            to: TOKEN_CONFIG.contractAddress as Address,
            data: transferData,
            value: BigInt(0),
          }
        ]
      })

      // Wait for the transaction to be confirmed
      const receipt = await state.kernelClient.waitForUserOperationReceipt({
        hash: userOpHash
      })

      const txHash = receipt?.receipt?.transactionHash || userOpHash

      // Add transaction to history
      const batchTransaction: Transaction = {
        hash: txHash,
        status: 'success',
        type: 'batch',
        amount: transferAmount,
        recipient: to,
        timestamp: Date.now()
      }
      addTransaction(batchTransaction)

      // Refresh balances after successful transaction
      setTimeout(() => {
        if (state.walletAddress) {
          getTokenBalance();
          getEthBalance();
        }
      }, 2000); // Wait 2 seconds for blockchain to update

      updateState({
        txHash,
        txStatus: 'success',
        txMessage: 'Batch transaction completed successfully!',
        isLoading: false
      })

      return txHash
    } catch (err: any) {
      console.error('Batch transaction failed:', err)
      updateState({
        error: err.message || 'Batch transaction failed',
        txStatus: 'error',
        txMessage: err.message || 'Batch transaction failed',
        isLoading: false
      })
      throw err
    }
  }, [state.kernelClient, updateState])

  const getTokenBalance = useCallback(async (): Promise<string> => {
    if (!state.walletAddress) {
      return '0'
    }

    try {      
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http()
      })

      const balance = await publicClient.readContract({
        address: TOKEN_CONFIG.contractAddress as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [state.walletAddress as Address]
      })


      // Convert from wei to token units
      const balanceFormatted = (Number(balance) / Math.pow(10, TOKEN_CONFIG.decimals)).toFixed(6)
      return balanceFormatted
    } catch (err) {
      console.error('Failed to get token balance:', err)
      return '0'
    }
  }, [state.walletAddress])

  const getEthBalance = useCallback(async (): Promise<string> => {
    if (!state.walletAddress) {
      return '0'
    }

    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http()
      })

      const balance = await publicClient.getBalance({
        address: state.walletAddress as Address
      })

      // Convert from wei to ETH (18 decimals)
      const balanceFormatted = (Number(balance) / Math.pow(10, 18)).toFixed(6)
      return balanceFormatted
    } catch (err) {
      console.error('Failed to get ETH balance:', err)
      return '0'
    }
  }, [state.walletAddress])

  const clearTransactionState = useCallback(() => {
    updateState({
      txHash: null,
      txStatus: 'idle',
      txMessage: '',
      error: null
    })
  }, [updateState])

  // Fetch transaction history using ZeroDev bundler (best-effort) + on-chain logs (no API key)
  const fetchTransactionHistory = useCallback(async () => {
    if (!state.walletAddress) return []

    try {
      const allTxs: Transaction[] = []

      // 1) Try ZeroDev bundler for user operations (may not be supported on all endpoints)
      try {
        const bundlerUrl = ZERODEV_CONFIG.bundlerUrl
        if (bundlerUrl) {
          const reqBody = {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getUserOperationsByAddress',
            params: [state.walletAddress]
          }
          const resp = await fetch(bundlerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody)
          })
          if (resp.ok) {
            const data = await resp.json()
            const ops = Array.isArray(data?.result) ? data.result : []
            for (let i = 0; i < ops.length; i++) {
              const op = ops[i]
              allTxs.push({
                hash: op?.transactionHash || op?.userOpHash || `userOp_${i}`,
                status: op?.success ? 'success' : 'failed',
                type: 'transfer',
                amount: '0',
                recipient: op?.target || undefined,
                timestamp: op?.timestamp ? Number(op.timestamp) * 1000 : Date.now() - i * 60000
              })
            }
          }
        }
      } catch {
        // ignore bundler failures
      }

      // 2) On-chain logs for ERC20 transfers (chunked to avoid 10k range limits)
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http()
      })

      const latestBlock = await publicClient.getBlockNumber()
      const maxDepth = 100_000n
      const startBlock = latestBlock > maxDepth ? latestBlock - maxDepth : 0n
      const step = 8_000n // under 10k provider range limit

      const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

      const logs: any[] = []
      let toBlock = latestBlock
      while (toBlock >= startBlock) {
        const fromBlock = toBlock > step ? toBlock - step + 1n : 0n
        try {
          const [outgoing, incoming] = await Promise.all([
            publicClient.getLogs({
              address: TOKEN_CONFIG.contractAddress as Address,
              event: transferEvent,
              args: { from: state.walletAddress as Address },
              fromBlock,
              toBlock
            }),
            publicClient.getLogs({
              address: TOKEN_CONFIG.contractAddress as Address,
              event: transferEvent,
              args: { to: state.walletAddress as Address },
              fromBlock,
              toBlock
            })
          ])
          logs.push(...outgoing, ...incoming)
        } catch {
          // ignore chunk failures
        }
        if (fromBlock === 0n) break
        toBlock = fromBlock - 1n
      }

      const dedupedLogs = logs.filter((log, idx, arr) => arr.findIndex(l => l.transactionHash === log.transactionHash && l.logIndex === log.logIndex) === idx)

      const uniqueBlocks = Array.from(new Set(dedupedLogs.map(l => l.blockNumber as bigint).filter(Boolean)))
      const blockTsMap = new Map<string, number>()
      await Promise.all(uniqueBlocks.map(async (bn) => {
        try {
          const block = await publicClient.getBlock({ blockNumber: bn })
          blockTsMap.set(bn.toString(), Number(block.timestamp) * 1000)
        } catch {}
      }))

      const tokenTxs: Transaction[] = dedupedLogs.map((log) => {
        const value = (log.args?.value ?? 0n) as bigint
        const to = (log.args?.to ?? '0x') as string
        const bn = (log.blockNumber as bigint) || 0n
        const ts = blockTsMap.get(bn.toString()) || Date.now()
        return {
          hash: log.transactionHash as string,
          status: 'success' as const,
          type: 'transfer' as const,
          amount: (Number(value) / Math.pow(10, TOKEN_CONFIG.decimals)).toString(),
          recipient: to,
          timestamp: ts
        }
      })

      const merged = [...allTxs, ...tokenTxs]
        .filter((tx, index, arr) => arr.findIndex(t => (t.hash || '') === (tx.hash || '')) === index)
        .sort((a, b) => (a.timestamp || 0) < (b.timestamp || 0) ? 1 : -1)
        .slice(0, 50)

      setState(prev => ({ ...prev, transactions: merged }))
      return merged
    } catch (err) {
      console.error('Failed to fetch transaction history:', err)
      return []
    }
  }, [state.walletAddress])

  // Initialize wallet when user email changes
  useEffect(() => {
    console.log('🔄 useSmartWallet: useEffect triggered:', {
      userEmail,
      hasKernelClient: !!state.kernelClient,
      isLoading: state.isLoading
    });
    
    if (userEmail && !state.kernelClient && !state.isLoading) {
      console.log('🔄 useSmartWallet: Initializing wallet...');
      initializeWallet()
    }
  }, [userEmail, state.kernelClient, state.isLoading, initializeWallet])

  return {
    // Wallet state
    walletAddress: state.walletAddress,
    isLoading: state.isLoading,
    error: state.error,
    
    // Transaction state
    txHash: state.txHash,
    txStatus: state.txStatus,
    txMessage: state.txMessage,
    transactions: state.transactions,
    
    // Actions
    sendGaslessTransfer,
    batchApprovalAndTransfer,
    getTokenBalance,
    getEthBalance,
    clearTransactionState,
    initializeWallet,
    addTransaction,
    fetchTransactionHistory
  }
}
