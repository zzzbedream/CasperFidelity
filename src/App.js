import React from 'react';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { issuePointsReal, redeemRewardReal } from './utils/transactionsReal';
import { ADMIN_ADDRESS } from './config';
import { Gift, User, ShieldCheck, LogOut, Sparkles, Zap, Check, Loader2 } from 'lucide-react';

const Dashboard = () => {
    const { isConnected, activeKey, balance, connect, disconnect } = useWallet();
    const [loading, setLoading] = React.useState(false);
    const [logs, setLogs] = React.useState([]);

    // Form states
    const [recipientAddress, setRecipientAddress] = React.useState('');
    const [issueAmount, setIssueAmount] = React.useState('10');

    const addLog = (msg, type = 'info', hash = null) => {
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type, hash }, ...prev].slice(0, 10));
    };

    const isAdmin = activeKey && (activeKey.toLowerCase() === ADMIN_ADDRESS.toLowerCase());

    const handleIssuePoints = async (e) => {
        e.preventDefault();
        if (!activeKey) {
            alert('No wallet connected');
            return;
        }

        if (!recipientAddress || !issueAmount) {
            alert('Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            addLog(`Issuing ${issueAmount} CFT to ${recipientAddress.slice(0, 10)}...`, 'info');

            const provider = window.CasperWalletProvider ? window.CasperWalletProvider() : null;
            if (!provider) throw new Error('Wallet provider not available');

            const result = await issuePointsReal(recipientAddress, issueAmount, activeKey, provider, addLog);

            if (result.success) {
                addLog(`✅ Success! Hash: ${result.hash}`, 'success', result.hash);
                alert(`¡ÉXITO! Puntos emitidos.\n\nHash: ${result.hash}\n\nVer en: https://testnet.cspr.live/deploy/${result.hash}`);
                setRecipientAddress('');
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

    // Quick test button for admin
    const handleQuickTest = () => {
        setRecipientAddress('0203406c56d6f200a7c757b23447aa3f68e3c41d6555f18ff307fe87fe55c4259b0f');
        setIssueAmount('10');
    };

    // PREMIUM LOGIN SCREEN
    if (!isConnected) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
                {/* Radial Gradient Background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-radial from-blue-900/20 via-transparent to-transparent"></div>

                {/* Login Card */}
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 p-12 rounded-3xl shadow-2xl text-center max-w-md w-full">
                    <img src="/LOGO.png" alt="CasperFidelity" className="h-32 w-auto mx-auto mb-8 object-contain mix-blend-screen" style={{ filter: 'brightness(1.2) contrast(1.1)' }} />

                    <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Web3 Loyalty Platform
                    </h2>
                    <p className="text-slate-400 mb-10">Blockchain-powered rewards</p>

                    <button
                        onClick={connect}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                    >
                        <span className="flex items-center justify-center gap-3">
                            <ShieldCheck size={22} />
                            <span className="text-lg">Connect Wallet</span>
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    // PREMIUM DASHBOARD
    return (
        <div className="min-h-screen bg-slate-950 relative">
            {/* Radial Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-radial from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>

            {/* HEADER */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/60 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <img src="/LOGO.png" alt="CasperFidelity" className="h-20 w-auto object-contain mix-blend-screen" style={{ filter: 'brightness(1.2) contrast(1.1)' }} />

                        <div className="flex items-center gap-4">
                            {/* User Badge */}
                            <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                                <span className="text-sm font-mono text-slate-300">
                                    {activeKey?.slice(0, 6)}...{activeKey?.slice(-4)}
                                </span>
                            </div>

                            <button
                                onClick={disconnect}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition-all"
                            >
                                <LogOut size={16} />
                                <span className="text-sm font-medium">Exit</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">

                {/* HERO BALANCE SECTION */}
                <div className="mb-12">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Verified On-Chain</span>
                        </div>

                        <div className="text-8xl font-black mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            {balance || '0'}
                        </div>
                        <p className="text-2xl text-slate-400 font-medium">CFT Tokens</p>
                    </div>
                </div>

                {/* ADMIN VIEW - ISSUE POINTS */}
                {isAdmin && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <ShieldCheck className="text-blue-400" size={32} />
                            Administrator Panel
                        </h2>

                        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:-translate-y-1 hover:border-blue-500/50 transition-all duration-300">
                            <form onSubmit={handleIssuePoints} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Recipient Address
                                    </label>
                                    <input
                                        type="text"
                                        value={recipientAddress}
                                        onChange={(e) => setRecipientAddress(e.target.value)}
                                        placeholder="01234567890abcdef..."
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all font-mono text-sm"
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Amount (CFT)
                                    </label>
                                    <input
                                        type="number"
                                        value={issueAmount}
                                        onChange={(e) => setIssueAmount(e.target.value)}
                                        placeholder="10"
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={handleQuickTest}
                                        className="px-6 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 font-medium transition-all disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        ⚡ Quick Test
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 size={20} className="animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Sparkles size={20} />
                                                Issue Points
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* CUSTOMER VIEW - REDEEM REWARDS */}
                {!isAdmin && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <Gift className="text-purple-400" size={32} />
                            Available Rewards
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Reward Card 1 */}
                            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:-translate-y-1 hover:border-purple-500/50 transition-all duration-300">
                                <div className="text-5xl mb-4">🎁</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Premium Gift</h3>
                                <p className="text-slate-400 mb-6">Exclusive reward</p>
                                <div className="flex items-end justify-between mb-6">
                                    <div>
                                        <span className="text-4xl font-black text-white">10</span>
                                        <span className="text-slate-400 ml-2">CFT</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRedeem('Premium Gift', 10)}
                                    disabled={loading || parseInt(balance) < 10}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={20} className="animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Gift size={20} />
                                            Redeem Now
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Reward Card 2 */}
                            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:-translate-y-1 hover:border-purple-500/50 transition-all duration-300">
                                <div className="text-5xl mb-4">⭐</div>
                                <h3 className="text-2xl font-bold text-white mb-2">VIP Access</h3>
                                <p className="text-slate-400 mb-6">Special perks</p>
                                <div className="flex items-end justify-between mb-6">
                                    <div>
                                        <span className="text-4xl font-black text-white">25</span>
                                        <span className="text-slate-400 ml-2">CFT</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRedeem('VIP Access', 25)}
                                    disabled={loading || parseInt(balance) < 25}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={20} className="animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Gift size={20} />
                                            Redeem Now
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACTIVITY LOG */}
                {logs.length > 0 && (
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
                        <h3 className="text-xl font-bold text-white mb-4">Activity Log</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {logs.map((log, idx) => (
                                <div
                                    key={idx}
                                    className={`px-4 py-2 rounded-lg text-sm font-mono ${log.type === 'success'
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : log.type === 'error'
                                            ? 'bg-red-500/10 text-red-400'
                                            : 'bg-slate-700/50 text-slate-300'
                                        }`}
                                >
                                    <span className="text-slate-500 mr-2">{log.time}</span>
                                    {log.msg}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer className="relative z-10 mt-20 border-t border-white/10 backdrop-blur-sm bg-slate-900/20">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="text-center text-sm text-slate-500">
                        Powered by Casper Network & Odra
                    </div>
                </div>
            </footer>
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
