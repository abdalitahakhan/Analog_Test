import React, { useState } from 'react';
import { Layers, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { useSmartWallet } from '../hooks/useSmartWallet';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { BatchTransferFormData } from '../types';
import { SEPOLIA_CONFIG } from '../config';

const BatchTransferForm: React.FC = () => {
  const { user } = useGoogleAuth();
  const { 
    batchApprovalAndTransfer, 
    isLoading, 
    error: walletError,
    txHash,
    txStatus,
    txMessage,
    clearTransactionState
  } = useSmartWallet(user?.email);
  
  const [formData, setFormData] = useState<BatchTransferFormData>({
    recipient: '',
    amount: '',
    approveAmount: ''
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
    if (!formData.recipient || !formData.amount || !formData.approveAmount) {
      setError('Please fill in all fields');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.recipient)) {
      setError('Please enter a valid wallet address');
      return;
    }

    if (parseFloat(formData.amount) <= 0 || parseFloat(formData.approveAmount) <= 0) {
      setError('Amounts must be greater than 0');
      return;
    }

    if (parseFloat(formData.approveAmount) < parseFloat(formData.amount)) {
      setError('Approve amount must be greater than or equal to transfer amount');
      return;
    }

    try {

      clearTransactionState();
      
      const txHash = await batchApprovalAndTransfer(
        formData.recipient,     // recipient (who receives the tokens)
        formData.amount,        // amount to transfer
        formData.approveAmount  // amount to approve for future use
      );
      
      if (txHash) {
        setSuccess(`Batch transaction initiated! Transaction hash: ${txHash.substring(0, 10)}...`);
        setFormData({ recipient: '', amount: '', approveAmount: '' });
      }
      
    } catch (err) {
      console.error('Batch transaction failed:', err);
      setError(err instanceof Error ? err.message : 'Batch transaction failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Batch Transfer</h3>
        <p className="text-gray-600">Execute approval and transfer in a single gasless transaction.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Batch Transaction</p>
            <p>This will approve the specified amount and then transfer tokens to the recipient in a single transaction.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="batch-recipient" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            id="batch-recipient"
            name="recipient"
            value={formData.recipient}
            onChange={handleInputChange}
            placeholder="0x..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            disabled={isLoading}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="batch-approve" className="block text-sm font-medium text-gray-700 mb-2">
              Approve Amount (USDC)
            </label>
            <input
              type="number"
              id="batch-approve"
              name="approveAmount"
              value={formData.approveAmount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="batch-amount" className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Amount (USDC)
            </label>
            <input
              type="number"
              id="batch-amount"
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
          disabled={isLoading || !formData.recipient || !formData.amount || !formData.approveAmount}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Layers className="w-5 h-5" />
              Execute Batch Transaction
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BatchTransferForm;