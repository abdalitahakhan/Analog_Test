# 🚀 ZeroDev Smart Wallet dApp

A modern, production-ready decentralized application (dApp) that demonstrates **Google OAuth + Gasless Transactions + Batched Actions** using ZeroDev's Account Abstraction technology.

## ✨ Features

### 🔐 **Authentication & Security**
- **Google OAuth Integration**: Secure login using Google Identity Services
- **Smart Wallet Creation**: Deterministic smart wallet generation from user email
- **Account Abstraction**: No need to manage private keys or seed phrases

### 💰 **Blockchain Functionality**
- **Gasless Transactions**: Users can send USDC without paying gas fees
- **Batch Transactions**: Approve + Transfer in a single transaction
- **Real-time Balances**: Live ETH and USDC balance tracking
- **Transaction History**: On-chain transaction logging and analytics

### 🎯 **User Experience**
- **Modern UI**: Built with React, TypeScript, and TailwindCSS
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Live blockchain data and transaction status
- **Transaction Analytics**: Success rates, volume tracking, and statistics

## 🏗️ Architecture

### **Frontend Stack**
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **TailwindCSS** for modern, responsive styling
- **React Router** for client-side navigation
- **Lucide React** for beautiful icons

### **Blockchain Integration**
- **ZeroDev SDK v5**: Latest Account Abstraction implementation
- **Kernel v3.1**: Most recent and recommended kernel version
- **ECDSA Validator**: Plugin for EOA signing capabilities
- **Viem**: Modern Ethereum client for blockchain interactions

### **Smart Contract Support**
- **ERC-20 Tokens**: Full support for USDC and other ERC-20 tokens
- **Sepolia Testnet**: Ethereum testnet for development and testing
- **Account Abstraction**: UserOperation-based transaction system

## 📋 Prerequisites

### **Required Software**
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

### **Blockchain Requirements**
- **Sepolia Testnet ETH**: For testing transactions
- **Sepolia USDC**: Test tokens for transfers
- **ZeroDev Project**: Account Abstraction infrastructure

### **API Keys & Services**
- **Google Cloud Console**: For OAuth 2.0 credentials
- **ZeroDev Dashboard**: For project configuration

## 🚀 Quick Start

### **1. Clone the Repository**
```bash
git clone <your-repository-url>
cd Analog_Test
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
Create a `.env.local` file in the root directory:

```env
# Google OAuth Configuration
VITE_REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# ZeroDev Configuration
VITE_REACT_APP_ZERODEV_PROJECT_ID=your_zerodev_project_id_here
VITE_REACT_APP_ZERODEV_BUNDLER_URL=https://rpc.zerodev.app/api/v3/your_project_id
VITE_REACT_APP_ZERODEV_PAYMASTER_URL=https://rpc.zerodev.app/api/v3/your_project_id
```

### **4. Start Development Server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## ⚙️ Configuration

### **Google OAuth Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Identity Services
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:5173`
6. Copy the Client ID to your `.env.local` file

### **ZeroDev Setup**
1. Visit [ZeroDev Dashboard](https://dashboard.zerodev.app/)
2. Create a new project
3. Select "Sepolia" as your network
4. Copy the Project ID and URLs to your `.env.local` file
5. Configure gas sponsoring policies (recommended: "Sponsor all transactions")

### **Network Configuration**
The dApp is configured for **Sepolia Testnet** by default:
- **Chain ID**: 11155111
- **RPC URL**: `https://rpc.sepolia.org`
- **Explorer**: `https://sepolia.etherscan.io`
- **USDC Contract**: `0x2b9Ca0A8C773bb1B92A3dDAE9F882Fd14457DACc`

## 🧪 Testing

### **Getting Test Tokens**
1. **Sepolia ETH**: Use [Sepolia Faucet](https://sepoliafaucet.com/)
2. **Sepolia USDC**: The dApp uses a mock USDC contract for testing

### **Testing Transactions**
1. **Login** with your Google account
2. **Create** a smart wallet (automatic)
3. **Send** test USDC transfers
4. **Monitor** transaction status and balances

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── LoginPage.tsx   # Google OAuth login
│   ├── WalletDashboard.tsx  # Main wallet interface
│   ├── TransferForm.tsx     # Single transfer form
│   ├── BatchTransferForm.tsx # Batch transaction form
│   └── TransactionHistory.tsx # Transaction display
├── hooks/              # Custom React hooks
│   ├── useGoogleAuth.ts      # Google authentication
│   └── useSmartWallet.ts     # ZeroDev integration
├── config/             # Configuration files
│   ├── index.ts        # App configuration
│   └── zerodev.ts      # ZeroDev settings
└── types/              # TypeScript type definitions
```

## 🔧 Available Scripts

- **`npm run dev`**: Start development server
- **`npm run build`**: Build for production
- **`npm run preview`**: Preview production build
- **`npm run lint`**: Run ESLint for code quality

## 🌐 Deployment

### **Build for Production**
```bash
npm run build
```

### **Deploy to Vercel/Netlify**
1. Connect your repository to Vercel or Netlify
2. Set environment variables in the deployment platform
3. Deploy automatically on push to main branch

## 🐛 Troubleshooting

### **Common Issues**

1. **"ZeroDev SDK failed"**
   - Check your ZeroDev project ID and URLs
   - Ensure gas sponsoring is enabled
   - Verify network configuration

2. **"Google OAuth not working"**
   - Verify Google Client ID in environment
   - Check authorized origins in Google Console
   - Ensure Google+ API is enabled

3. **"Transaction failed"**
   - Check Sepolia testnet connection
   - Verify USDC contract address
   - Ensure sufficient test ETH for gas

### **Debug Mode**
The dApp includes comprehensive logging for debugging:
- Check browser console for detailed logs
- Monitor network requests in DevTools
- Verify blockchain transactions on Sepolia Etherscan

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **ZeroDev Team** for Account Abstraction infrastructure
- **Google** for OAuth and Identity Services
- **Ethereum Foundation** for Sepolia testnet
- **Viem Team** for modern Ethereum client

## 📞 Support

For issues and questions:
- **GitHub Issues**: Create an issue in this repository
- **ZeroDev Discord**: Join the [ZeroDev community](https://discord.gg)
- **Documentation**: Check [ZeroDev docs](https://docs.zerodev.app/)

---

**Built with ❤️ using modern web technologies and blockchain innovation**