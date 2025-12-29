import React, { useState, useEffect } from 'react';
import { CONTRACT_HASH, ADMIN_ADDRESS, NETWORK_NAME } from '../config';
import { DeployUtil, CLPublicKey, CLValueBuilder, RuntimeArgs } from 'casper-js-sdk';
import { getBalance } from '../utils/casperService';
import { Buffer } from 'buffer';

const rewards = [
    { id: 1, name: "Premium Coffee", cost: 10, icon: "☕" },
    { id: 2, name: "20% Discount", cost: 50, icon: "🏷️" },
    { id: 3, name: "Free Merchandise", cost: 100, icon: "🎁" }
];

const UserView = ({ activeAccount }) => {
    const [balance, setBalance] = useState(0);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchBalance = async () => {
            if (activeAccount?.public_key) {
                const bal = await getBalance(CONTRACT_HASH, activeAccount.public_key);
                setBalance(bal);
            }
        };

        fetchBalance();
        // Poll every 10 seconds
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [activeAccount]);

    const handleRedeem = async (reward) => {
        if (!activeAccount?.public_key) {
            alert("Please connect your wallet first.");
            return;
        }

        if (parseInt(balance) < reward.cost) {
            alert("Insufficient balance!");
            return;
        }

        try {
            console.log("=== REDEEM STARTED ===");
            setStatus(`Redeeming ${reward.name}...`);

            // 1. CLEAN CONTRACT HASH
            const cleanHash = CONTRACT_HASH.startsWith("hash-")
                ? CONTRACT_HASH.substring(5)
                : CONTRACT_HASH;

            console.log("Clean Hash:", cleanHash);

            // 2. CONSTRUCT ARGUMENTS
            const recipientKey = CLValueBuilder.key(
                CLPublicKey.fromHex(ADMIN_ADDRESS)
            );

            const amountU256 = CLValueBuilder.u256(reward.cost);

            // 3. CREATE DEPLOY
            const deployParams = new DeployUtil.DeployParams(
                CLPublicKey.fromHex(activeAccount.public_key),
                NETWORK_NAME
            );

            const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
                Uint8Array.from(Buffer.from(cleanHash, 'hex')),
                "transfer",
                RuntimeArgs.fromMap({
                    recipient: recipientKey,
                    amount: amountU256
                })
            );

            const payment = DeployUtil.standardPayment(3000000000); // 3 CSPR

            const deploy = DeployUtil.makeDeploy(deployParams, session, payment);
            console.log("Deploy constructed:", deploy);

            // 4. SIGN with native Casper Wallet
            const deployJson = DeployUtil.deployToJson(deploy);
            const signedDeploy = await window.casperlabsSdkBrowserHelper.sign(
                JSON.stringify(deployJson),
                activeAccount.public_key
            );

            // 5. Send to network
            const deployObject = DeployUtil.deployFromJson(signedDeploy).unwrap();
            const response = await fetch(`https://node.testnet.casper.network/rpc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'account_put_deploy',
                    params: [DeployUtil.deployToJson(deployObject)],
                    id: 1
                })
            });

            const result = await response.json();
            const deployHash = result.result?.deploy_hash;

            if (!deployHash) throw new Error('Failed to submit deploy');

            console.log("SUCCESS! Hash:", deployHash);
            setStatus(`Redemption Sent! Hash: ${deployHash}`);
            alert(`Success! Redemption sent. Hash: ${deployHash}`);

        } catch (err) {
            console.error("CRITICAL REDEEM ERROR:", err);
            setStatus('Error: ' + err.message);
            alert(`REDEEM FAILED: ${err.message}`);
        }
    };

    return (
        <div className="max-w-md mx-auto m-4 space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-blue-100 text-sm font-medium mb-1">Total Balance</div>
                <div className="text-4xl font-bold">{balance} <span className="text-xl font-normal opacity-80">CFT</span></div>
                <div className="mt-4 text-xs bg-blue-900/30 inline-block px-3 py-1 rounded-full">
                    Wallet: {activeAccount?.public_key?.substring(0, 10)}...
                </div>
            </div>

            {/* Rewards List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Available Rewards</h2>
                <div className="space-y-4">
                    {rewards.map(reward => (
                        <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">{reward.icon}</span>
                                <div>
                                    <div className="font-semibold text-gray-900">{reward.name}</div>
                                    <div className="text-sm text-gray-500">{reward.cost} CFT Points</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRedeem(reward)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Redeem
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {status && <div className="text-center text-sm text-gray-500">{status}</div>}
        </div>
    );
};

export default UserView;
