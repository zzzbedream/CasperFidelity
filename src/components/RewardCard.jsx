import { motion } from 'framer-motion';
import { Gift, Lock, Check } from 'lucide-react';

export function RewardCard({ reward, balance, onRedeem, loading, isRedeemed }) {
    const canAfford = parseInt(balance) >= reward.cost;
    const progressPercentage = Math.min((parseInt(balance) / reward.cost) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: canAfford && !isRedeemed ? 1.02 : 1 }}
            className={`relative p-6 rounded-2xl border-2 transition-all ${isRedeemed
                    ? 'bg-green-50 border-green-300 opacity-80'
                    : canAfford
                        ? 'bg-gradient-to-br from-blue-50 to-white border-blue-300 shadow-lg hover:shadow-xl'
                        : 'bg-gray-50 border-gray-200 opacity-70'
                }`}
        >
            {/* Redeemed Badge */}
            {isRedeemed && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    CLAIMED
                </div>
            )}

            {/* Content */}
            <div className="flex items-start gap-4">
                {/* Icon */}
                <motion.div
                    className={`text-6xl ${!canAfford && !isRedeemed && 'grayscale'}`}
                    animate={{ rotate: isRedeemed ? [0, 10, -10, 0] : 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {reward.icon}
                </motion.div>

                <div className="flex-1">
                    {/* Title & Description */}
                    <h3 className="text-xl font-bold text-gray-900">{reward.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{reward.description}</p>

                    {/* Cost & Button */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-blue-600" />
                            <span className="text-lg font-bold text-blue-600">
                                {reward.cost} CFT
                            </span>
                        </div>

                        <button
                            onClick={() => onRedeem(reward)}
                            disabled={!canAfford || loading || isRedeemed}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${isRedeemed
                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                    : canAfford && !loading
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isRedeemed ? (
                                <span className="flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Claimed
                                </span>
                            ) : loading ? (
                                'Processing...'
                            ) : !canAfford ? (
                                <span className="flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Locked
                                </span>
                            ) : (
                                'Redeem Now'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar (only if not affordable and not redeemed) */}
            {!canAfford && !isRedeemed && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>Your balance: <strong>{balance} CFT</strong></span>
                        <span>Need: <strong className="text-blue-600">{reward.cost - parseInt(balance)} more CFT</strong></span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full"
                        />
                    </div>
                    <div className="text-center mt-1 text-xs text-gray-500">
                        {progressPercentage.toFixed(0)}% to unlock
                    </div>
                </div>
            )}
        </motion.div>
    );
}
