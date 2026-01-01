import React from 'react';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { issuePointsReal, redeemRewardReal } from './utils/transactionsReal';
import AdminView from './components/AdminView';
import UserView from './components/UserView';
import { ADMIN_ADDRESS } from './config';
import { Gift, User, ShieldCheck, LogOut } from 'lucide-react';

const Dashboard = () => {
    const { isConnected, activeKey, balance, connect, disconnect } = useWallet();
    const [loading, setLoading] = React.useState(false);
    const [logs, setLogs] = React.useState([]);

    const addLog = (msg, type = 'info', hash = null) => {
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type, hash }, ...prev].slice(0, 10));
    };

    const isAdmin = activeKey && (activeKey.toLowerCase() === ADMIN_ADDRESS.toLowerCase());

    const handleIssuePoints = async (recipient, amount) => {
        if (!activeKey) {
            alert('No wallet connected');
            return;
        }

        setLoading(true);
        try {
            addLog(`Issuing ${amount} CFT to ${recipient.slice(0, 10)}...`, 'info');

            // Get provider
            const provider = window.CasperWalletProvider ? window.CasperWalletProvider() : null;
            if (!provider) throw new Error('Wallet provider not available');

            const result = await issuePointsReal(recipient, amount, activeKey, provider, addLog);

            if (result.success) {
                addLog(`✅ Success! Hash: ${result.hash}`, 'success', result.hash);
                alert(`¡ÉXITO! Puntos emitidos.\n\nHash: ${result.hash}\n\nVer en: https://testnet.cspr.live/deploy/${result.hash}`);
            }
        } catch (error) {
            console.error(error);
            addLog(`❌ Error: ${error.message}`, 'error');
            alert(`ERROR: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (rewardName, cost) => {
        if (!activeKey) {
            alert('No wallet connected');
            return;
        }

        if (parseInt(balance) < cost) {
            alert(`Insufficient balance!\n\nYou have: ${balance} CFT\nNeed: ${cost} CFT`);
            return;
        }

        setLoading(true);
        try {
            addLog(`Redeeming "${rewardName}" (${cost} CFT)...`, 'info');

            const provider = window.CasperWalletProvider ? window.CasperWalletProvider() : null;
            if (!provider) throw new Error('Wallet provider not available');

            const result = await redeemRewardReal(rewardName, cost, activeKey, provider, addLog);

            if (result.success) {
                addLog(`✅ Redeemed! Hash: ${result.hash}`, 'success', result.hash);
                alert(`¡CANJE EXITOSO!\n\nHash: ${result.hash}\n\nVer en: https://testnet.cspr.live/deploy/${result.hash}`);
            }
        } catch (error) {
            console.error(error);
            addLog(`❌ Error: ${error.message}`, 'error');
            alert(`ERROR: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // LOGIN SCREEN
    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden z-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700 text-center max-w-md w-full relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-lg">
                        <Gift size={40} />
                    </div>
                    <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        CasperFidelity
                    </h1>
                    <p className="text-gray-400 mb-8 text-lg">Loyalty Points on Blockchain</p>
                    <button
                        onClick={connect}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                        Connect Casper Wallet
                    </button>
                    <div className="mt-6 text-xs text-gray-500 font-mono">Testnet • Secure & Decentralized</div>
                </div>
            </div>
        );
    }

    // DASHBOARD
    return (
        <div className="min-h-screen bg-gray-50">
            {/* NAVBAR */}
            <nav className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg text-white">
                            <Gift size={24} />
                        </div>
                        <span className="font-extrabold text-2xl text-gray-800">
                            Casper<span className="text-blue-600">Fidelity</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* ROLE BADGE */}
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-2 ${isAdmin
                                ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                                : 'bg-green-100 text-green-700 border-2 border-green-300'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-600' : 'bg-green-600'}`}></div>
                            {isAdmin ? 'ADMIN' : 'CUSTOMER'}
                        </div>

                        {/* BALANCE (Customer Only) */}
                        {!isAdmin && (
                            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                                <div className="text-[10px] uppercase font-bold text-blue-600">CFT Balance</div>
                                <div className="font-mono text-sm font-bold text-blue-900">{balance} CFT</div>
                            </div>
                        )}

                        {/* ACCOUNT */}
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Connected</span>
                            <span className="font-mono text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded border">
                                {activeKey?.slice(0, 10)}...{activeKey?.slice(-6)}
                            </span>
                        </div>

                        {/* LOGOUT */}
                        <button
                            onClick={disconnect}
                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-4 py-2"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <main className="p-8 max-w-4xl mx-auto">
                {/* ROLE HEADER */}
                <div className="mb-8 text-center">
                    {isAdmin ? (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 inline-block">
                            <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2 justify-center">
                                <ShieldCheck size={24} />
                                Administrator Mode
                            </h2>
                            <p className="text-purple-600 text-sm mt-1">Authorized to issue Fidelity Points</p>
                        </div>
                    ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 inline-block">
                            <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2 justify-center">
                                <User size={24} />
                                Customer Portal
                            </h2>
                            <p className="text-blue-600 text-sm mt-1">Redeem your rewards below</p>
                        </div>
                    )}
                </div>

                {/* CONDITIONAL VIEW */}
                {isAdmin
                    ? <AdminView onIssuePoints={handleIssuePoints} logs={logs} loading={loading} />
                    : <UserView balance={balance} onRedeem={handleRedeem} logs={logs} loading={loading} />
                }
            </main>
        </div>
    );
};

export default function App() {
    return (
        <WalletProvider>
            <Dashboard />
        </WalletProvider>
    );
}
