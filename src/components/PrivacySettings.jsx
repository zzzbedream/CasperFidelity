import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldOff, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';

export function PrivacySettings() {
  const { walletAddress } = useWallet();
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);
  
  useEffect(() => {
    // Load settings from localStorage
    if (walletAddress) {
      const saved = localStorage.getItem(`privacy_${walletAddress}`);
      if (saved) {
        const settings = JSON.parse(saved);
        setEncryptionEnabled(settings.encryption !== false);
        setShowBalance(settings.showBalance !== false);
        setShowTransactions(settings.showTransactions === true);
      }
    }
  }, [walletAddress]);
  
  const saveSettings = (newSettings) => {
    if (walletAddress) {
      localStorage.setItem(`privacy_${walletAddress}`, JSON.stringify(newSettings));
    }
  };
  
  const toggleEncryption = () => {
    const newState = !encryptionEnabled;
    setEncryptionEnabled(newState);
    saveSettings({ encryption: newState, showBalance, showTransactions });
    
    toast.success(
      newState ? '🔒 Encryption enabled' : '🔓 Encryption disabled'
    );
  };
  
  const toggleShowBalance = () => {
    const newState = !showBalance;
    setShowBalance(newState);
    saveSettings({ encryption: encryptionEnabled, showBalance: newState, showTransactions });
  };
  
  const toggleShowTransactions = () => {
    const newState = !showTransactions;
    setShowTransactions(newState);
    saveSettings({ encryption: encryptionEnabled, showBalance, showTransactions: newState });
  };
  
  if (!walletAddress) return null;
  
  return (
    <motion.div  
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200"
    >
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Shield className="w-6 h-6 text-blue-600" />
        Privacy Settings
      </h3>
      
      {/* Encryption Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-semibold">Data Encryption</div>
            <div className="text-sm text-gray-600">
              Encrypt balances and transactions
            </div>
          </div>
          <button
            onClick={toggleEncryption}
            className={`relative w-14 h-7 rounded-full transition ${
              encryptionEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <motion.div
              animate={{ x: encryptionEnabled ? 28 : 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
            />
          </button>
        </div>
        
        {/* Show/Hide Balance */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-semibold">Show Balance</div>
            <div className="text-sm text-gray-600">
              Display CFT balance publicly
            </div>
          </div>
          <button
            onClick={toggleShowBalance}
            className="text-blue-600 hover:text-blue-700"
          >
            {showBalance ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Show Transaction History */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-semibold">Transaction History</div>
            <div className="text-sm text-gray-600">
              Show past redemptions
            </div>
          </div>
          <button
            onClick={toggleShowTransactions}
            className="text-blue-600 hover:text-blue-700"
          >
            {showTransactions ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Status Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800">
          {encryptionEnabled ? (
            <>✅ Your data is encrypted and secure</>
          ) : (
            <>⚠️ Data encryption is disabled</>
          )}
        </div>
      </div>
    </motion.div>
  );
}
