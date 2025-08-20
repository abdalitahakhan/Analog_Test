import React from 'react';
import { ExternalLink, Clock, CheckCircle, XCircle, Send, Layers } from 'lucide-react';
import { Transaction } from '../types';
import { EXPLORER_URL } from '../config';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'success':
        return 'text-green-800 bg-green-100 border-green-200';
      case 'failed':
        return 'text-red-800 bg-red-100 border-red-200';
      default:
        return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    return type === 'batch' ? (
      <Layers className="w-4 h-4 text-purple-600" />
    ) : (
      <Send className="w-4 h-4 text-blue-600" />
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {transactions.map((tx) => (
          <div key={tx.hash} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getTypeIcon(tx.type)}
                  <span className="font-medium text-gray-900">
                    {tx.type === 'batch' ? 'Batch Transfer' : 'Transfer'}
                  </span>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${getStatusColor(tx.status)}`}>
                  {getStatusIcon(tx.status)}
                  <span className="capitalize">{tx.status}</span>
                </div>
              </div>
              
              <a
                href={`${EXPLORER_URL}/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <code>{truncateHash(tx.hash)}</code>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            
            {(tx.amount || tx.recipient) && (
              <div className="mt-3 flex items-center gap-6 text-sm text-gray-600">
                {tx.amount && (
                  <span>Amount: <span className="font-medium">{tx.amount} USDC</span></span>
                )}
                {tx.recipient && (
                  <span>To: <code className="bg-gray-100 px-2 py-1 rounded">{truncateHash(tx.recipient)}</code></span>
                )}
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500">
              {formatDate(tx.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;