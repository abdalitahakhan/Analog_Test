import React, { useEffect, useState } from 'react';
import { LogIn, Zap, Shield, Layers } from 'lucide-react';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

const LoginPage: React.FC = () => {
  const { signInWithGoogle, loading, isGoogleLoaded, error, user } = useGoogleAuth();
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletCreationTimeout, setWalletCreationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-redirect to dashboard when user is set
  useEffect(() => {
    if (user && user.smartWalletAddress && user.smartWalletAddress !== '0x0000000000000000000000000000000000000000') {
      // Clear timeout and hide loading screen
      if (walletCreationTimeout) {
        clearTimeout(walletCreationTimeout);
        setWalletCreationTimeout(null);
      }
      setShowWalletInfo(false);
      
      // Use window.location to avoid React Router conflicts
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    }
  }, [user, walletCreationTimeout]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (walletCreationTimeout) {
        clearTimeout(walletCreationTimeout);
      }
    };
  }, [walletCreationTimeout]);

  // Initialize Google Sign-In button when Google Identity Services is loaded
  useEffect(() => {
    if (isGoogleLoaded && window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_REACT_APP_GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          if (response.credential) {
            try {

              
              // Decode the JWT token to get user info
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              
              // Show the wallet creation screen
              setShowWalletInfo(true);
              
              // Set a timeout to hide loading screen if wallet creation takes too long
              const timeout = setTimeout(() => {
                setShowWalletInfo(false);
                alert('Wallet creation is taking longer than expected. Please try refreshing the page.');
              }, 30000); // 30 seconds timeout
              setWalletCreationTimeout(timeout);
              
              // Create the smart wallet using the hook

              
              try {
                // Create user object with temporary smart wallet address
                const user = {
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture,
                  smartWalletAddress: '0x0000000000000000000000000000000000000000' // Temporary
                };
                
                // Store user temporarily
                localStorage.setItem('user', JSON.stringify(user));
                
                // Now create the real smart wallet
                await signInWithGoogle();
                

              } catch (error) {
                // Clear timeout and hide loading screen on error
                if (walletCreationTimeout) {
                  clearTimeout(walletCreationTimeout);
                  setWalletCreationTimeout(null);
                }
                setShowWalletInfo(false);
                // Show error to user
                alert('Failed to create smart wallet. Please try again.');
              }
              
            } catch (err) {

            }
          }
        }
      });
      
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { 
          theme: 'outline', 
          size: 'large', 
          text: 'signin_with', 
          shape: 'rectangular', 
          width: '100%', 
          height: '48px' 
        }
      );
    }
  }, [isGoogleLoaded, signInWithGoogle]);

  // If user is already logged in with a smart wallet, redirect immediately
  if (user && user.smartWalletAddress && user.smartWalletAddress !== '0x0000000000000000000000000000000000000000') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-green-600 text-2xl">✅</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Ready! 🎉</h2>
            <p className="text-gray-600 mb-6">Redirecting to dashboard...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showWalletInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Smart Wallet... 🔐</h2>
            <p className="text-gray-600 mb-6">Setting up your wallet on Polygon Amoy testnet.</p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Status:</p>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-800">Creating wallet...</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Creating smart wallet...
            </div>
            
            {/* Timeout warning */}
            <div className="text-xs text-gray-400">
              This may take a few moments. If it takes too long, try refreshing the page.
            </div>
            
            {/* Manual retry button */}
            <button
              onClick={() => {
                setShowWalletInfo(false);
                window.location.reload();
              }}
              className="mt-4 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Wallet dApp</h1>
            </div>
            <div className="text-sm text-gray-500">Login Page</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to ZeroDev Smart Wallet</h1>
            <p className="text-gray-600">Sign in with Google to create your gasless smart wallet</p>
          </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!isGoogleLoaded ? (
          <div className="w-full bg-gray-100 text-gray-500 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
            Loading Google Sign-In...
          </div>
        ) : (
          <div id="google-signin-button" className="w-full"></div>
        )}

        {/* Fallback button for manual trigger */}
        <button
          onClick={signInWithGoogle}
          disabled={loading || !isGoogleLoaded}
          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Creating Smart Wallet...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Manual Sign In
            </>
          )}
        </button>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <Shield className="w-4 h-4" />
            <span>Ready for your wallet implementation</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Layers className="w-4 h-4" />
            <span>Gasless transactions on Polygon Amoy</span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;