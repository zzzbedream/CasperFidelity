import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLocalBalance } from '../utils/localBalanceTracker';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [activeKey, setActiveKey] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [balance, setBalance] = useState(0);

    // Initialize provider on mount
    useEffect(() => {
        const initProvider = () => {
            if (window.CasperWalletProvider) {
                try {
                    const client = window.CasperWalletProvider();
                    setProvider(client);
                    reconnectSession(client);
                } catch (err) {
                    console.error("Error initializing provider:", err);
                }
            }
        };

        setTimeout(initProvider, 500);
        window.addEventListener('casper-wallet:loaded', initProvider);
        return () => window.removeEventListener('casper-wallet:loaded', initProvider);
    }, []);

    // Silent reconnection
    const reconnectSession = async (client) => {
        try {
            const connected = await client.isConnected();
            if (connected) {
                const key = await client.getActivePublicKey();
                setActiveKey(key);
                setIsConnected(true);
                setBalance(getLocalBalance(key));
            }
        } catch (err) {
            console.error("Error reconnecting:", err);
        }
    };

    // Event listeners
    useEffect(() => {
        if (!provider) return;

        const handleActiveKeyChanged = (event) => {
            console.log("🔄 Account changed:", event.detail);
            const key = event.detail?.activeKey;

            if (key) {
                console.log("Switching to:", key);
                setIsConnected(false);
                setTimeout(() => {
                    setActiveKey(key);
                    setIsConnected(true);
                    setBalance(getLocalBalance(key));
                }, 50);
            } else {
                handleDisconnected();
            }
        };

        const handleDisconnected = () => {
            console.log("🔌 Disconnected");
            setIsConnected(false);
            setActiveKey(null);
        };

        const handleBalanceUpdate = () => {
            if (activeKey) setBalance(getLocalBalance(activeKey));
        };

        window.addEventListener('casper-wallet:activeKeyChanged', handleActiveKeyChanged);
        window.addEventListener('casper-wallet:disconnected', handleDisconnected);
        window.addEventListener('balance-updated', handleBalanceUpdate);

        return () => {
            window.removeEventListener('casper-wallet:activeKeyChanged', handleActiveKeyChanged);
            window.removeEventListener('casper-wallet:disconnected', handleDisconnected);
            window.removeEventListener('balance-updated', handleBalanceUpdate);
        };
    }, [provider, activeKey]);

    // Connect
    const connect = async () => {
        try {
            const CasperWalletProvider = window.CasperWalletProvider;
            const currentProvider = CasperWalletProvider ? CasperWalletProvider() : window.casperWalletHelper;

            if (!currentProvider) {
                alert("Please install Casper Wallet and reload");
                return;
            }

            setProvider(currentProvider);

            const isConnectedResult = await currentProvider.requestConnection();
            if (isConnectedResult) {
                const key = await currentProvider.getActivePublicKey();
                setActiveKey(key);
                setIsConnected(true);
                setBalance(getLocalBalance(key));
            }
        } catch (e) {
            console.error("Connection Error:", e);
            alert("Error connecting. Please open extension manually and reload.");
        }
    };

    // Disconnect  
    const disconnect = async () => {
        console.log("🔓 Soft disconnect");
        setIsConnected(false);
        setActiveKey(null);
        setProvider(null);
    };

    return (
        <WalletContext.Provider value={{
            provider, activeKey, isConnected, balance, connect, disconnect
        }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);
