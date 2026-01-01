import React, { useState } from 'react';

const AdminView = ({ onIssuePoints, logs, loading }) => {
    const [customerAddr, setCustomerAddr] = useState('');
    const [amount, setAmount] = useState('');

    const handleIssue = async (e) => {
        e.preventDefault();
        if (!customerAddr || !amount) {
            alert('Please enter customer address and amount');
            return;
        }
        await onIssuePoints(customerAddr, parseInt(amount));
        setCustomerAddr('');
        setAmount('');
    };

    return (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-green-900/30 w-12 h-12 rounded-lg flex items-center justify-center text-green-400 text-2xl">💰</div>
                    <div>
                        <h3 className="text-xl font-bold">Issue Points</h3>
                        <p className="text-gray-400 text-sm">Send CFT tokens to any user</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setCustomerAddr("0203406c56d6f200a7c757b23447aa3f68e3c41d6555f18ff307fe87fe55c4259b0f");
                        setAmount("10");
                    }}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-blue-300 px-3 py-1 rounded-lg border border-slate-600 transition-colors"
                >
                    ⚡ Quick Test: 10 CFT
                </button>
            </div>

            <form onSubmit={handleIssue} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Customer Address</label>
                    <input
                        type="text"
                        value={customerAddr}
                        onChange={(e) => setCustomerAddr(e.target.value)}
                        placeholder="Public Key (01...)"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 font-mono text-sm"
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Amount (CFT)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 font-bold"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Processing..." : "Issue Points"}
                </button>
            </form>

            {logs && logs.length > 0 && (
                <div className="mt-6 border-t border-slate-700 pt-4">
                    <p className="text-xs text-gray-500 mb-2 font-bold uppercase">Activity Log</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {logs.slice(0, 3).map((log, idx) => (
                            <div key={idx} className={`text-xs p-2 rounded border ${log.type === 'error' ? 'bg-red-900/20 border-red-900/50 text-red-300' :
                                log.type === 'success' ? 'bg-green-900/20 border-green-900/50 text-green-300' :
                                    'bg-slate-900 border-slate-700 text-gray-400'
                                }`}>
                                <span className="opacity-50 text-[10px] mr-2">{log.time}</span>
                                {log.msg}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminView;
