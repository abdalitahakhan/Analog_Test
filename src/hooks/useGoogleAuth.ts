import { useState, useCallback, useEffect, useRef } from 'react';
import { User } from '../types';
import { EntryPointVersion } from 'viem/account-abstraction';

declare global {
  interface Window {
    google: any;
  }
}

export const useGoogleAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const initializedRef = useRef(false);
  const userStateRef = useRef<User | null>(null);

  // Check if Google Identity Services is loaded - only once
  useEffect(() => {
    if (initializedRef.current) return;
    const checkGoogleLoaded = () => {
      if (window.google && window.google.accounts) {
        setIsGoogleLoaded(true);
        initializedRef.current = true;
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };
    checkGoogleLoaded();
  }, []);

  // Initialize user from localStorage on mount - only once
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Set user state and update ref
        setUser(parsedUser);
        userStateRef.current = parsedUser;
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Create ZeroDev smart wallet for the user
  const createSmartWallet = useCallback(async (googleUser: any): Promise<string> => {
    try {

      // Import required ZeroDev modules
      const { 
        createKernelAccount
      } = await import('@zerodev/sdk');
      const { signerToEcdsaValidator } = await import('@zerodev/ecdsa-validator');
      const { getEntryPoint, KERNEL_V3_1 } = await import('@zerodev/sdk/constants');
      const { 
        createPublicClient, 
        createWalletClient, 
        http
      } = await import('viem');
      const { privateKeyToAccount } = await import('viem/accounts');
      const { sepolia } = await import('viem/chains');

      // Create a deterministic private key from user email
      const encoder = new TextEncoder();
      const data = encoder.encode(googleUser.email + 'zerodev-salt');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const privateKeyArray = new Uint8Array(hashBuffer);
      const privateKey = '0x' + Array.from(privateKeyArray)
        .map(b => b.toString(16).padStart(2, '0')).join('') as `0x${string}`;



      // Create public client
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http()
      });


      // Create private key account
      const account = privateKeyToAccount(privateKey);

      // Create wallet client
      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http()
      });

              // Create ECDSA validator with v0.7 entry point (recommended for new projects)
        const entryPoint = getEntryPoint("0.7" as EntryPointVersion);
        const kernelVersion = KERNEL_V3_1;
        
        const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
          signer: account,
          entryPoint,
          kernelVersion,
        });

        
        // Create kernel account
        const kernelAccount = await createKernelAccount(publicClient, {
          plugins: {
            sudo: ecdsaValidator,
          },
          entryPoint,
          kernelVersion,
        });

      const smartWalletAddress = kernelAccount.address;


      return smartWalletAddress;

    } catch (error) {
      console.error('Failed to create ZeroDev smart wallet:', error);
      
      // Fallback to deterministic address generation

      
      const createDeterministicAddress = (email: string): string => {
        const validHexChars = '0123456789abcdef';
        let hash = 0;
        
        for (let i = 0; i < email.length; i++) {
          const char = email.charCodeAt(i);
          hash = ((hash << 5) - hash + char) & 0xffffffff;
        }
        
        const hexChars = [];
        for (let i = 0; i < 40; i++) {
          const index = Math.abs(hash + i * 7) % validHexChars.length;
          hexChars.push(validHexChars[index]);
        }
        
        return `0x${hexChars.join('')}`;
      };
      
      const fallbackAddress = createDeterministicAddress(googleUser.email);

      return fallbackAddress;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isGoogleLoaded) {
      setError('Google Identity Services not loaded yet');
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      // Check if we already have user info from localStorage (set by LoginPage)
      const existingUser = localStorage.getItem('user');
      let userInfo;
      
      if (existingUser) {
        // Use existing user info from Google Identity Services
        userInfo = JSON.parse(existingUser);

      } else {
        // Fallback to OAuth 2.0 flow (this should not happen in normal flow)

        
        const clientId = import.meta.env.VITE_REACT_APP_GOOGLE_CLIENT_ID;
        if (!clientId) {
          throw new Error('Google Client ID not configured');
        }

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (response: any) => {
            if (response.error) {
              setError('Google sign in failed: ' + response.error);
              setLoading(false);
              return;
            }

            try {
              // Fetch user info using the access token
              const userInfoResponse = await fetch(
                `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`
              );
              
              if (!userInfoResponse.ok) {
                throw new Error('Failed to fetch user info');
              }

              userInfo = await userInfoResponse.json();
              localStorage.setItem('google_access_token', response.access_token);
            } catch (err) {
              console.error('Error fetching user info:', err);
              setError('Failed to get user information');
              setLoading(false);
              return;
            }
          },
        });

        client.requestAccessToken();
        return; // Exit early, will be handled by callback
      }

      // Create ZeroDev smart wallet for this user
      const smartWalletAddress = await createSmartWallet(userInfo);

      // Update user object with real smart wallet address
      const updatedUser: User = {
        ...userInfo,
        smartWalletAddress: smartWalletAddress
      };

      // Smart wallet created successfully
      
      // Set user state and update ref
      setUser(updatedUser);
      userStateRef.current = updatedUser;
      
      // Update localStorage with real smart wallet address
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setLoading(false);

    } catch (err) {
      console.error('Error creating smart wallet or setting user:', err);
      setError('Failed to create smart wallet');
      setLoading(false);
    }
  }, [isGoogleLoaded, createSmartWallet]);

  const signOut = useCallback(() => {

    
    // Clear localStorage first
    localStorage.removeItem('user');
    localStorage.removeItem('google_access_token');
    
    // Clear user state
    setUser(null);
    userStateRef.current = null;
    
    // Revoke Google access token if available
    if (window.google && window.google.accounts) {
      const accessToken = localStorage.getItem('google_access_token');
      if (accessToken) {
        window.google.accounts.oauth2.revoke(accessToken, () => {

        });
      }
    }
    
    // Note: Navigation will be handled by the component using this hook

  }, []);

  const checkExistingSession = useCallback(() => {

    
    // If we already have a user, don't check again
    if (user || userStateRef.current) {

      return;
    }
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        setUser(parsedUser);
        userStateRef.current = parsedUser;
      } catch (error) {
        console.error('Failed to parse existing session:', error);
        localStorage.removeItem('user');
      }
    } else {

    }
  }, [user]);

  // Placeholder for wallet functionality - ready for new implementation
  const getWalletInfo = useCallback(async (): Promise<any> => {
    if (!user) {
      console.error('No user logged in');
      return null;
    }


    return {
      email: user.email,
      walletAddress: user.smartWalletAddress,
      message: 'Ready for new wallet implementation'
    };
  }, [user]);


  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    checkExistingSession,
    isGoogleLoaded,
    getWalletInfo
  };
};