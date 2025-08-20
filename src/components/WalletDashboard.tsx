import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Copy, ExternalLink, Wallet, Send, Layers, Check, TrendingUp, Activity, Network, Coins, RefreshCw } from 'lucide-react';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useSmartWallet } from '../hooks/useSmartWallet';
import TransferForm from './TransferForm';
import BatchTransferForm from './BatchTransferForm';
import TransactionHistory from './TransactionHistory';
import { SEPOLIA_CONFIG, TOKEN_CONFIG } from '../config';

const WalletDashboard: React.FC = () => {
  const { user } = useGoogleAuth();
  const navigate = useNavigate();

  // Error boundary for debugging
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('🔄 Dashboard: Error caught:', error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  
  // ZeroDev Smart Wallet Integration
  const { 
    walletAddress: smartWalletAddress,
    isLoading: walletLoading,
    error: walletError,
    getTokenBalance,
    getEthBalance,
    transactions: smartWalletTransactions,
    fetchTransactionHistory
  } = useSmartWallet(user?.email);


  const [activeTab, setActiveTab] = useState<'transfer' | 'batch'>('transfer');
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  // Removed unused wallet info toggle state
  const [realTokenBalance, setRealTokenBalance] = useState<string>('0');
  const [realEthBalance, setRealEthBalance] = useState<string>('0');
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Refresh balances every 30 seconds
  useEffect(() => {
    if (!user?.smartWalletAddress) return;
    
    const interval = setInterval(() => {
      if (smartWalletAddress) {
        fetchRealBalances();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.smartWalletAddress, smartWalletAddress]);

  const handleSignOut = () => {
    setShowSignoutConfirm(true);
  };

  const confirmSignOut = () => {
    setShowSignoutConfirm(false);
    // Clear user data and navigate to login
    localStorage.removeItem('user');
    localStorage.removeItem('google_access_token');
    navigate('/login');
  };

  const cancelSignOut = () => {
    setShowSignoutConfirm(false);
  };

  // Removed unused handlers

  

  // Fetch real balances
  const fetchRealBalances = async () => {
    if (!smartWalletAddress) return;
    
    try {
      setBalanceLoading(true);
      const [tokenBalance, ethBalance] = await Promise.all([
        getTokenBalance(),
        getEthBalance()
      ]);
      setRealTokenBalance(tokenBalance);
      setRealEthBalance(ethBalance);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch balance when wallet is ready
  useEffect(() => {
    if (smartWalletAddress && !walletLoading) {
      fetchRealBalances();
    }
  }, [smartWalletAddress, walletLoading]);

  // Load transactions when component mounts or address changes
  useEffect(() => {
    if (smartWalletAddress) {
      
      // First try to load from localStorage
      const storageKey = `transactions_${smartWalletAddress}`;
      const existingTxs = localStorage.getItem(storageKey);
      if (existingTxs) {
        try {
          const transactions = JSON.parse(existingTxs);
          
          // Force refresh of smart wallet state if we have transactions
          if (transactions.length > 0) {
            // This will trigger a re-render with the correct transaction count
          }
        } catch (err) {
          console.error('🔄 Dashboard: Failed to parse stored transactions:', err);
        }
      }
      
      // Then fetch from Etherscan
      fetchTransactionHistory();
    }
  }, [smartWalletAddress, fetchTransactionHistory]);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      window.location.href = '/login';
    }
    
  }, []);

  // // Route guard - redirect to login if no user
  // if (!user) {
  //   console.log('🔄 Dashboard: No user, redirecting to login');
  //   // Use window.location to avoid React Router conflicts
  //   window.location.href = '/login';
  //   return null;
  // }

  // // Additional guard for incomplete user data
  // if (!user?.email || !user?.smartWalletAddress) {
  //   console.log('🔄 Dashboard: Incomplete user data, redirecting to login');
  //   window.location.href = '/login';
  //   return null;
  // }

  // // Debug: Log current state
  // console.log('🔄 Dashboard: Rendering with user:', {
  //   email: user?.email,
  //   smartWalletAddress: user?.smartWalletAddress,
  //   smartWalletAddressFromHook: smartWalletAddress,
  //   walletLoading: walletLoading,
  //   walletError: walletError
  // });

  // Get real transaction statistics from smart wallet
  const stats = {
    total: smartWalletTransactions.length,
    successful: smartWalletTransactions.filter(tx => tx.status === 'success').length,
    pending: smartWalletTransactions.filter(tx => tx.status === 'pending').length,
    failed: smartWalletTransactions.filter(tx => tx.status === 'failed').length,
    totalVolume: smartWalletTransactions
      .filter(tx => tx.status === 'success')
      .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0),
    successRate: smartWalletTransactions.length > 0 
      ? Math.round((smartWalletTransactions.filter(tx => tx.status === 'success').length / smartWalletTransactions.length) * 100) 
      : 0
  };
  
  // Calculate total balance from real balances (using approximate Sepolia ETH price)
  const ethPriceUSD = 2000; // Approximate Sepolia ETH price
  const totalBalance = parseFloat(realTokenBalance) + parseFloat(realEthBalance) * ethPriceUSD;



  return (
    <>{user && (
      
    
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={user?.picture}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h2 className="font-semibold text-gray-900">{user?.name}</h2>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalBalance.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {realEthBalance} ETH + {realTokenBalance} USDC
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Coins className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                Live from blockchain
              </div>
            </div>

                      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {stats.successful} successful, {stats.pending} pending
              </div>
              <div className="mt-2 text-xs text-gray-500">
                From smart wallet: {smartWalletTransactions.length}
              </div>
            </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalVolume.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Across all transactions
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Check className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Transaction success rate
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Wallet Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">ZeroDev Smart Wallet</h3>
                  <p className="text-sm text-gray-600">Account Abstraction Wallet</p>
                  {walletLoading && (
                    <p className="text-xs text-blue-600">Initializing wallet...</p>
                  )}
                  {walletError && (
                    <p className="text-xs text-red-600">Error: {walletError}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Smart Wallet Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-800">
                      {smartWalletAddress ? 
                        `${smartWalletAddress.substring(0, 8)}...${smartWalletAddress.substring(smartWalletAddress.length - 6)}` :
                        walletLoading ? 'Loading...' : 'Not available'
                      }
                    </span>
                    {smartWalletAddress && (
                      <button
                        onClick={() => navigator.clipboard.writeText(smartWalletAddress)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ETH Balance:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {balanceLoading ? 'Loading...' : `${realEthBalance} ETH`}
                    </span>
                    <button
                      onClick={fetchRealBalances}
                      disabled={balanceLoading}
                      className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                      title="Refresh balances"
                    >
                      <RefreshCw className={`w-4 h-4 text-gray-500 ${balanceLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{TOKEN_CONFIG.symbol} Balance:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {balanceLoading ? 'Loading...' : `${realTokenBalance} ${TOKEN_CONFIG.symbol}`}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  Contract: {TOKEN_CONFIG.contractAddress.substring(0, 10)}...{TOKEN_CONFIG.contractAddress.substring(TOKEN_CONFIG.contractAddress.length - 8)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Network:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {SEPOLIA_CONFIG.chainName}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Chain ID:</span>
                  <span className="text-sm font-semibold text-gray-900">{SEPOLIA_CONFIG.chainId}</span>
                </div>
                
                {smartWalletAddress && (
                  <div className="pt-2">
                    <a
                      href={`${SEPOLIA_CONFIG.blockExplorerUrls[0]}/address/${smartWalletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Etherscan
                    </a>
                  </div>
                )}
                
              
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('transfer')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'transfer'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    Gasless Transfer
                  </button>
                  <button
                    onClick={() => setActiveTab('batch')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'batch'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Batch Transfer
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'transfer' ? (
                  <TransferForm />
                ) : (
                  <BatchTransferForm />
                )}
              </div>
            </div>

            {/* Transaction History */}
            {smartWalletTransactions.length > 0 && (
              <div className="mt-8">
                <TransactionHistory transactions={smartWalletTransactions} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Dialog */}
      {showSignoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign Out</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to sign out? You'll need to sign in again to access your wallet.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelSignOut}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSignOut}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    )}
    </>
  );
};

export default WalletDashboard;