import React from 'react';

const rewards = [
    { id: 1, name: "Premium Coffee", cost: 10, icon: "☕", desc: "Start your day with energy" },
    { id: 2, name: "20% Discount", cost: 50, icon: "🏷️", desc: "Save on your next purchase" },
    { id: 3, name: "Free Hoodie", cost: 100, icon: "👕", desc: "Exclusive community swag" }
];

const UserView = ({ balance, onRedeem, loading }) => {
    const handleRedeem = async (reward) => {
        if (parseInt(balance) < reward.cost) {
            alert("Insufficient balance!");
            return;
        }
        await onRedeem(reward.name, reward.cost);
    };

    return (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center text-purple-400 text-2xl">🎁</div>
                <div>
                    <h3 className="text-xl font-bold">Redeem Rewards</h3>
                    <p className="text-gray-400 text-sm">Spend your points responsibly</p>
                </div>
            </div>

            <div className="grid gap-4">
                {rewards.map(reward => (
                    <div key={reward.id} className="group flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 hover:border-purple-500/50 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="text-3xl bg-slate-800 w-12 h-12 flex items-center justify-center rounded-lg shadow-inner">
                                {reward.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors">{reward.name}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded text-nowrap">
                                        {reward.cost} CFT
                                    </span>
                                    <span className="text-xs text-gray-500 hidden sm:inline">{reward.desc}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleRedeem(reward)}
                            disabled={loading || parseInt(balance) < reward.cost}
                            className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-gray-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
                        >
                            Redeem
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">Transaction validates via Smart Contract</p>
            </div>
        </div>
    );
};

export default UserView;
