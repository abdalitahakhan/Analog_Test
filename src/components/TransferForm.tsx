import React, { useState } from 'react';
import { Send, AlertCircle, ExternalLink } from 'lucide-react';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { TransferFormData } from '../types';
import { SEPOLIA_CONFIG } from '../config';

const TransferForm: React.FC = () => {
  const { user } = useGoogleAuth();
  const { 
    sendGaslessTransfer, 
    isLoading, 
    error: walletError,
    txHash,
    txStatus,
    txMessage,
    clearTransactionState
  } = useSmartWallet(user?.email);
  
  const [formData, setFormData] = useState<TransferFormData>({
    recipient: '',
    amount: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
    clearTransactionState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!formData.recipient || !formData.amount) {
      setError('Please fill in all fields');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.recipient)) {
      setError('Please enter a valid wallet address');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {

      clearTransactionState();
      
      const txHash = await sendGaslessTransfer(formData.recipient, formData.amount);
      
      if (txHash) {
        setSuccess(`Gasless transfer initiated! Transaction hash: ${txHash.substring(0, 10)}...`);
        setFormData({ recipient: '', amount: '' });
      }
      
    } catch (err) {
      console.error('Transfer failed:', err);
      setError(err instanceof Error ? err.message : 'Transfer failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Send USDC</h3>
        <p className="text-gray-600">Send tokens without paying gas fees using account abstraction.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            id="recipient"
            name="recipient"
            value={formData.recipient}
            onChange={handleInputChange}
            placeholder="0x..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (USDC)
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* ZeroDev Transaction Status */}
        {txStatus !== 'idle' && (
          <div className={`p-4 rounded-xl border ${
            txStatus === 'pending' ? 'bg-blue-50 border-blue-200' :
            txStatus === 'success' ? 'bg-green-50 border-green-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {txStatus === 'pending' && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
              <div>
                <p className={`font-medium ${
                  txStatus === 'pending' ? 'text-blue-800' :
                  txStatus === 'success' ? 'text-green-800' :
                  'text-red-800'
                }`}>
                  {txMessage}
                </p>
                {txHash && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600">Transaction Hash:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {txHash.substring(0, 20)}...{txHash.substring(txHash.length - 20)}
                      </code>
                      <a
                        href={`${SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Etherscan
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {walletError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800">Wallet Error: {walletError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !formData.recipient || !formData.amount}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Gasless Transfer
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TransferForm;